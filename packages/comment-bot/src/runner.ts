import { resolveLLM } from "./llm";
import { loadPromptLibrary } from "./library";
import { processComment, type ProcessDeps, type ProcessOutcome } from "./processor";
import { dbStore, getCommentRow, getConnection, reopenComment, rowToComment, updateConnectionToken, type ConnectionRow } from "./store";
import {
  getInstagramMediaContext,
  instagramGraphBase,
  type InstagramMode,
  refreshInstagramToken,
  replyToInstagramComment,
  sendInstagramPrivateReply,
} from "./instagram";
import { getVideoContexts, listRecentThreads, refreshYouTubeToken, replyToYouTubeComment } from "./youtube";
import type { IncomingComment, MediaContext } from "./types";

/** Live wiring of the processor to the database, the prompt doc and the real platform APIs. */

export function botPaused(): boolean {
  return /^(1|true|yes)$/i.test(process.env.COMMENT_BOT_PAUSED ?? "");
}
function dryRun(): boolean {
  return /^(1|true|yes)$/i.test(process.env.COMMENT_BOT_DRY_RUN ?? "");
}

async function baseDeps(): Promise<Omit<ProcessDeps, "senders">> {
  return { store: dbStore, library: await loadPromptLibrary(), llm: resolveLLM(), dryRun: dryRun() };
}

function tally(outcomes: ProcessOutcome[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const o of outcomes) counts[o] = (counts[o] ?? 0) + 1;
  return counts;
}

// ---------------------------------------------------------------- YouTube

export async function youtubeAccessToken(conn: ConnectionRow): Promise<string> {
  const fresh = conn.accessToken && conn.accessTokenExpiresAt && conn.accessTokenExpiresAt.getTime() > Date.now() + 60_000;
  if (fresh) return conn.accessToken!;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret || !conn.refreshToken) throw new Error("YouTube needs GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and a reconnect.");
  const token = await refreshYouTubeToken({ refreshToken: conn.refreshToken, clientId, clientSecret });
  const expiresAt = new Date(Date.now() + token.expires_in * 1000);
  await updateConnectionToken("YOUTUBE", token.access_token, expiresAt);
  return token.access_token;
}

export async function runYouTubePoll(options: { timeBudgetMs?: number; maxComments?: number } = {}) {
  if (botPaused()) return { platform: "YOUTUBE", skipped: "paused" };
  const conn = await getConnection("YOUTUBE");
  if (!conn) return { platform: "YOUTUBE", skipped: "not connected" };
  const started = Date.now();
  const budget = options.timeBudgetMs ?? 5_000;
  const accessToken = await youtubeAccessToken(conn);
  const channelId = conn.accountId;

  const backfillHours = Number(process.env.YOUTUBE_BACKFILL_HOURS ?? 48);
  const cutoff = conn.connectedAt.getTime() - backfillHours * 3600_000;
  const threads = await listRecentThreads(accessToken, channelId);
  const settled = await dbStore.settledIds("YOUTUBE", threads.map((t) => t.comment.commentId));
  const todo = threads
    .filter((t) => t.canReply && !t.ownerAlreadyReplied)
    .filter((t) => t.comment.authorId !== channelId)
    .filter((t) => (t.comment.commentedAt?.getTime() ?? 0) >= cutoff)
    .filter((t) => !settled.has(t.comment.commentId))
    .map((t) => t.comment)
    .reverse() // oldest first
    .slice(0, options.maxComments ?? 3);

  if (!todo.length) return { platform: "YOUTUBE", seen: threads.length, processed: {} };

  const videos = await getVideoContexts(accessToken, todo.map((c) => c.mediaId!).filter(Boolean)).catch(() => new Map<string, MediaContext>());
  const deps: ProcessDeps = {
    ...(await baseDeps()),
    getMedia: async (c) => (c.mediaId ? videos.get(c.mediaId) : undefined),
    senders: { publicReply: async (c, text) => void (await replyToYouTubeComment(accessToken, c.commentId, text)) },
  };
  const outcomes: ProcessOutcome[] = [];
  for (const comment of todo) {
    if (Date.now() - started > budget) break; // the rest are picked up by the next poll
    outcomes.push(await processComment(deps, comment));
  }
  return { platform: "YOUTUBE", seen: threads.length, pending: todo.length, processed: tally(outcomes) };
}

// ---------------------------------------------------------------- Instagram

function instagramDeps(conn: ConnectionRow, base: Omit<ProcessDeps, "senders">): ProcessDeps {
  const token = conn.accessToken!;
  const graph = instagramGraphBase((conn.metadata as { mode?: InstagramMode } | null)?.mode);
  return {
    ...base,
    getMedia: async (c) => (c.mediaId ? getInstagramMediaContext(token, c.mediaId, graph) : undefined),
    senders: {
      publicReply: async (c, text) => void (await replyToInstagramComment(token, c.commentId, text, graph)),
      privateReply: (c, text) => sendInstagramPrivateReply(token, conn.accountId, c.commentId, text, graph),
    },
  };
}

export async function handleInstagramComments(events: { accountId: string; comment: IncomingComment }[]) {
  if (botPaused() || !events.length) return { platform: "INSTAGRAM", skipped: botPaused() ? "paused" : "no comments" };
  const conn = await getConnection("INSTAGRAM");
  if (!conn?.accessToken) return { platform: "INSTAGRAM", skipped: "not connected" };
  const deps = instagramDeps(conn, await baseDeps());
  const outcomes: ProcessOutcome[] = [];
  for (const { accountId, comment } of events) {
    if (accountId !== conn.accountId) continue; // event for some other account
    if (comment.authorId === conn.accountId) continue;
    outcomes.push(await processComment(deps, comment));
  }
  return { platform: "INSTAGRAM", processed: tally(outcomes) };
}

/** Retry Instagram comments that failed (e.g. a timeout); webhooks are not re-sent once we answered 200. */
export async function retryInstagramFailures(limit = 5) {
  if (botPaused()) return { platform: "INSTAGRAM", skipped: "paused" };
  const conn = await getConnection("INSTAGRAM");
  if (!conn?.accessToken) return { platform: "INSTAGRAM", skipped: "not connected" };
  const rows = await dbStore.retryable("INSTAGRAM", limit);
  // Meta only accepts a private reply within 7 days of the comment.
  const fresh = rows.filter((r) => Date.now() - (r.commentedAt ?? r.createdAt).getTime() < 6.5 * 24 * 3600_000);
  if (!fresh.length) return { platform: "INSTAGRAM", retried: {} };
  const deps = instagramDeps(conn, await baseDeps());
  const outcomes: ProcessOutcome[] = [];
  for (const row of fresh) outcomes.push(await processComment(deps, rowToComment(row)));
  return { platform: "INSTAGRAM", retried: tally(outcomes) };
}

/** Instagram long-lived tokens last 60 days; refresh once fewer than 10 remain. */
export async function refreshInstagramTokenIfNeeded() {
  const conn = await getConnection("INSTAGRAM");
  // Unified-login system-user tokens don't expire and can't be refreshed this way.
  if ((conn?.metadata as { mode?: string } | null)?.mode === "unified") return { refreshed: false, note: "system-user token" };
  if (!conn?.accessToken || !conn.accessTokenExpiresAt) return { refreshed: false };
  const daysLeft = (conn.accessTokenExpiresAt.getTime() - Date.now()) / 86_400_000;
  if (daysLeft > 10) return { refreshed: false, daysLeft: Math.round(daysLeft) };
  const token = await refreshInstagramToken(conn.accessToken);
  await updateConnectionToken("INSTAGRAM", token.access_token, new Date(Date.now() + token.expires_in * 1000));
  return { refreshed: true };
}

// ---------------------------------------------------------------- One comment, on demand

export interface ProcessNowResult {
  outcome: ProcessOutcome | "NOT_FOUND" | "NOT_CONNECTED" | "PAUSED";
  status?: string;
  publicReply?: string | null;
  privateReply?: string | null;
  error?: string | null;
  skipReason?: string | null;
}

/** "Retry" / "Send now" from the Comment Bot page: process one stored comment immediately. */
export async function processStoredComment(id: string): Promise<ProcessNowResult> {
  if (botPaused()) return { outcome: "PAUSED" };
  const row = await getCommentRow(id);
  if (!row) return { outcome: "NOT_FOUND" };
  if (row.status === "REPLIED") return { outcome: "ALREADY_HANDLED", status: row.status, publicReply: row.publicReply, privateReply: row.privateReply };
  await reopenComment(id);
  const comment = rowToComment(row);
  const conn = await getConnection(comment.platform);
  if (!conn?.accessToken && comment.platform === "INSTAGRAM") return { outcome: "NOT_CONNECTED" };
  if (!conn) return { outcome: "NOT_CONNECTED" };

  let deps: ProcessDeps;
  try {
    if (comment.platform === "INSTAGRAM") {
      deps = instagramDeps(conn, await baseDeps());
    } else {
      const token = await youtubeAccessToken(conn);
      const videos = comment.mediaId ? await getVideoContexts(token, [comment.mediaId]).catch(() => new Map<string, MediaContext>()) : new Map<string, MediaContext>();
      deps = {
        ...(await baseDeps()),
        getMedia: async (c) => (c.mediaId ? videos.get(c.mediaId) : undefined),
        senders: { publicReply: async (c, text) => void (await replyToYouTubeComment(token, c.commentId, text)) },
      };
    }
  } catch (error) {
    // Couldn't even start (e.g. the login needs reconnecting): record why on the comment.
    const message = (error as Error).message;
    await dbStore.update(comment.platform, comment.commentId, { status: "FAILED", error: message }).catch(() => undefined);
    return { outcome: "FAILED", status: "FAILED", error: message };
  }
  const outcome = await processComment(deps, comment);
  const after = await getCommentRow(id);
  return {
    outcome,
    status: after?.status,
    publicReply: after?.publicReply,
    privateReply: after?.privateReply,
    error: after?.error,
    skipReason: after?.skipReason,
  };
}
