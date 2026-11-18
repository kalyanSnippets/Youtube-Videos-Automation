"use server";

import { loadPromptLibrary, planReply, resolveLLM, type Platform, type ReplyPlan } from "@yaos/comment-bot";
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
