import { describe, expect, it } from "vitest";
import type { LLM } from "./llm";
import { buildInstagramDM, INSTAGRAM_DM_LIMIT, parseAIDecision, planReply, sanitiseAIReply } from "./responder";
import type { IncomingComment, PromptLibrary } from "./types";

const library: PromptLibrary = {
  about: "AI tutorials channel.",
  warnings: [],
  entries: [{ keyword: "FABLE", keywords: ["FABLE"], title: "Fable prompts", link: "https://ex.com/f", message: "Do the thing." }],
};

function fakeLLM(response: object | string): LLM & { calls: number } {
  const llm = {
    name: "fake",
    calls: 0,
    async complete() {
      llm.calls++;
      return typeof response === "string" ? response : JSON.stringify(response);
    },
  };
  return llm;
}

const ig = (text: string, extra: Partial<IncomingComment> = {}): IncomingComment => ({ platform: "INSTAGRAM", commentId: "c1", text, authorName: "ravi", ...extra });
const yt = (text: string): IncomingComment => ({ platform: "YOUTUBE", commentId: "y1", text, authorName: "@ravi" });

describe("planReply", () => {
  it("Instagram keyword: DM with the prompt plus a public note, no AI call", async () => {
    const llm = fakeLLM({ action: "reply", reply: "x" });
    const plan = await planReply({ comment: ig("FABLE"), library, llm, pick: () => 0 });
    expect(plan.action).toBe("KEYWORD");
    expect(plan.privateReply).toContain("Do the thing.");
    expect(plan.privateReply).toContain("https://ex.com/f");
    expect(plan.publicReply).toBe("Sent! Check your DMs 📩");
    expect(llm.calls).toBe(0);
  });

  it("YouTube keyword: the prompt goes in the public reply", async () => {
    const plan = await planReply({ comment: yt("fable!"), library, llm: null });
    expect(plan.action).toBe("KEYWORD");
    expect(plan.privateReply).toBeUndefined();
    expect(plan.publicReply).toContain("@ravi");
    expect(plan.publicReply).toContain("Do the thing.");
  });

  it("keyword plus a question: answers and delivers", async () => {
    const plan = await planReply({ comment: ig("FABLE does it work on windows?"), library, llm: fakeLLM({ action: "reply", reply: "Yes, works on Windows too!" }), pick: () => 0 });
    expect(plan.action).toBe("KEYWORD_AND_ANSWER");
    expect(plan.publicReply).toBe("Yes, works on Windows too!\n\nSent! Check your DMs 📩");
    expect(plan.privateReply).toContain("Do the thing.");
  });

  it("plain question: AI answer only", async () => {
    const plan = await planReply({ comment: yt("what mic do you use?"), library, llm: fakeLLM({ action: "reply", reply: "A Shure MV7!" }) });
    expect(plan).toEqual({ action: "AI_ANSWER", publicReply: "A Shure MV7!" });
  });

  it("AI can route a request to a library keyword", async () => {
    const plan = await planReply({ comment: ig("can I get the prompts from this reel"), library, llm: fakeLLM({ action: "reply", reply: "Of course!", keyword: "fable" }), pick: () => 0 });
    expect(plan.matchedKeyword).toBe("FABLE");
    expect(plan.privateReply).toContain("Do the thing.");
  });

  it("AI skip is respected", async () => {
    const plan = await planReply({ comment: yt("check my channel!!! sub4sub"), library, llm: fakeLLM({ action: "skip", reason: "self promo" }) });
    expect(plan.action).toBe("NONE");
    expect(plan.skipReason).toMatch(/self promo/);
  });

  it("without an AI key, non-keyword comments are skipped with a reason", async () => {
    const plan = await planReply({ comment: yt("great video"), library, llm: null });
    expect(plan.action).toBe("NONE");
    expect(plan.skipReason).toMatch(/GEMINI_API_KEY/);
  });

  it("garbage AI output is skipped, not posted", async () => {
    const plan = await planReply({ comment: yt("nice"), library, llm: fakeLLM("Sure! Here's a reply") });
    expect(plan.action).toBe("NONE");
  });
});

describe("safety helpers", () => {
  it("strips links and blocks leaked-instruction replies", () => {
    expect(sanitiseAIReply("Check https://evil.example now")).toBe("Check  now");
    expect(sanitiseAIReply("As an AI language model I can't")).toBeNull();
  });
  it("parses JSON wrapped in code fences", () => {
    expect(parseAIDecision('```json\n{"action":"reply","reply":"hi"}\n```')).toMatchObject({ action: "reply", reply: "hi" });
  });
  it("keeps long prompts inside Instagram's DM limit with a link to the rest", () => {
    const dm = buildInstagramDM({ keyword: "X", keywords: ["X"], title: "Big", message: "a".repeat(5000) }, "ravi", "https://docs.google.com/document/d/abc/view");
    expect(dm.length).toBeLessThanOrEqual(INSTAGRAM_DM_LIMIT);
    expect(dm).toContain("https://docs.google.com/document/d/abc/view");
  });
});
