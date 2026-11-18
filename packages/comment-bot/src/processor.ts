import type { LLM } from "./llm";
import { planReply } from "./responder";
import type { BotStore, CommentRow } from "./store";
import type { IncomingComment, MediaContext, PromptLibrary } from "./types";

/** Platform actions the processor needs. Real implementations wrap the API clients; tests pass fakes. */
export interface Senders {
  publicReply(comment: IncomingComment, text: string): Promise<void>;
  /** Instagram only. */
  privateReply?(comment: IncomingComment, text: string): Promise<void>;
}

export interface ProcessDeps {
  store: BotStore;
  library: PromptLibrary;
  llm: LLM | null;
  senders: Senders;
  getMedia?(comment: IncomingComment): Promise<MediaContext | undefined>;
  docViewUrl?: string;
  /** Plan and log but post nothing (COMMENT_BOT_DRY_RUN=true). */
  dryRun?: boolean;
}

export type ProcessOutcome = "REPLIED" | "SKIPPED" | "FAILED" | "DRY_RUN" | "ALREADY_HANDLED";

function errorText(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).slice(0, 2000);
}

/**
 * Handle one comment end to end. Safe to call more than once for the same comment
 * (webhook retries, overlapping polls): the store's claim lets only one run work on it,
 * and the row records which messages were actually sent so a retry never sends one twice.
 */
export async function processComment(deps: ProcessDeps, comment: IncomingComment): Promise<ProcessOutcome> {
  const row: CommentRow | null = await deps.store.claim(comment);
  if (!row) return "ALREADY_HANDLED";
  const { platform, commentId } = comment;
  try {
    const media = deps.getMedia ? await deps.getMedia(comment).catch(() => undefined) : undefined;
    const plan = await planReply({ comment, library: deps.library, media, llm: deps.llm, docViewUrl: deps.docViewUrl });

    if (plan.action === "NONE") {
      await deps.store.update(platform, commentId, { status: "SKIPPED", action: "NONE", skipReason: plan.skipReason ?? null, error: null });
      return "SKIPPED";
    }

    if (plan.action === "KEYWORD" && plan.matchedKeyword && (await deps.store.alreadyDelivered(platform, comment, plan.matchedKeyword))) {
      await deps.store.update(platform, commentId, {
        status: "SKIPPED",
        action: "KEYWORD",
        matchedKeyword: plan.matchedKeyword,
        skipReason: "Already sent this keyword to this person on this post in the last 24h",
        error: null,
      });
      return "SKIPPED";
    }

    if (deps.dryRun) {
      await deps.store.update(platform, commentId, {
        status: "DRY_RUN",
        action: plan.action,
        matchedKeyword: plan.matchedKeyword ?? null,
        publicReply: plan.publicReply ?? null,
        privateReply: plan.privateReply ?? null,
        skipReason: "Dry run: nothing was posted",
        error: null,
      });
      return "DRY_RUN";
    }

    await deps.store.update(platform, commentId, { action: plan.action, matchedKeyword: plan.matchedKeyword ?? null });

    // DM first: if it fails we must not post "check your DMs" publicly.
    if (plan.privateReply && !row.privateReply) {
      if (!deps.senders.privateReply) throw new Error(`${platform} has no private replies`);
      await deps.senders.privateReply(comment, plan.privateReply);
      await deps.store.update(platform, commentId, { privateReply: plan.privateReply });
    }
    if (plan.publicReply && !row.publicReply) {
      await deps.senders.publicReply(comment, plan.publicReply);
      await deps.store.update(platform, commentId, { publicReply: plan.publicReply });
    }

    await deps.store.update(platform, commentId, { status: "REPLIED", error: null, skipReason: null });
    return "REPLIED";
  } catch (error) {
    await deps.store.update(platform, commentId, { status: "FAILED", error: errorText(error) }).catch(() => undefined);
    return "FAILED";
  }
}
