"use server";

import { revalidatePath } from "next/cache";
import { db, ensureSchemaPatches, schema } from "@yaos/database";
import { clearPromptLibraryCache, loadPromptLibrary, normaliseTemplates, planReply, processStoredComment, resetFailedComments, resolveLLM, type Platform, type ProcessNowResult, type ReplyPlan } from "@yaos/comment-bot";
import { requireAdmin } from "@/lib/admin";

export interface TestReplyState {
  error?: string;
  plan?: ReplyPlan;
  platform?: Platform;
}

/** Preview what the bot would post for a comment. Posts nothing. Owner only, so strangers can't spend AI credits. */
export async function testReply(_prev: TestReplyState, form: FormData): Promise<TestReplyState> {
  await requireAdmin();
  const text = String(form.get("comment") ?? "").trim();
  const platform = (form.get("platform") === "YOUTUBE" ? "YOUTUBE" : "INSTAGRAM") as Platform;
  if (!text) return { error: "Type a comment to test." };
  try {
    const library = await loadPromptLibrary({ force: true });
    const plan = await planReply({
      comment: { platform, commentId: "preview", text, authorName: "viewer" },
      library,
      llm: resolveLLM(),
      media: { title: String(form.get("title") ?? "") || undefined },
    });
    return { plan, platform };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

/** "Retry failed" button: failed comments get picked up again by the next run (about a minute). */
export async function retryFailedComments(): Promise<void> {
  await requireAdmin();
  await resetFailedComments();
  revalidatePath("/comment-bot");
}

/**
 * Process one stored comment right now (used by the progress bar on the Comment Bot page, which
 * calls this once per comment so each result can be shown as it happens).
 */
export async function processCommentNow(id: string): Promise<ProcessNowResult> {
  await requireAdmin();
  try {
    return await processStoredComment(id);
  } catch (error) {
    return { outcome: "FAILED", error: (error as Error).message };
  }
}

export interface TemplatesFormState {
  error?: string;
  saved?: boolean;
}

/** Saves the reply wording from the "Reply messages" page. */
export async function saveTemplates(_prev: TemplatesFormState, form: FormData): Promise<TemplatesFormState> {
  await requireAdmin();
  try {
    const templates = normaliseTemplates({
      igPublicReplies: String(form.get("igPublicReplies") ?? "").split("\n"),
      igDm: String(form.get("igDm") ?? ""),
      youtubeKeywordReply: String(form.get("youtubeKeywordReply") ?? ""),
      aiStyle: String(form.get("aiStyle") ?? ""),
      generalMode: String(form.get("generalMode") ?? "ai"),
      generalReplies: String(form.get("generalReplies") ?? "").split("\n"),
    });
    if (!templates.igDm.includes("{prompt}") || !templates.youtubeKeywordReply.includes("{prompt}")) {
      return { error: "The Instagram DM and the YouTube reply must both contain {prompt}, or viewers won't get the prompt." };
    }
    await ensureSchemaPatches();
    await db
      .insert(schema.siteSettings)
      .values({ id: 1, botTemplates: templates as unknown as Record<string, unknown> })
      .onConflictDoUpdate({ target: schema.siteSettings.id, set: { botTemplates: templates as unknown as Record<string, unknown>, updatedAt: new Date() } });
    clearPromptLibraryCache();
    revalidatePath("/comment-bot");
    return { saved: true };
  } catch (error) {
    return { error: (error as Error).message };
  }
}
