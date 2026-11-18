"use server";

import { loadPromptLibrary, planReply, resolveLLM, safeEqual, type Platform, type ReplyPlan } from "@yaos/comment-bot";

export interface TestReplyState {
  error?: string;
  plan?: ReplyPlan;
  platform?: Platform;
}

/** Preview what the bot would post for a comment. Posts nothing. Needs the bot secret so strangers can't spend AI credits. */
export async function testReply(_prev: TestReplyState, form: FormData): Promise<TestReplyState> {
  const key = String(form.get("key") ?? "");
  if (!safeEqual(key, process.env.COMMENT_BOT_SECRET)) return { error: "Wrong or missing key (COMMENT_BOT_SECRET)." };
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
