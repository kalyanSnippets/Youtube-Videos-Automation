import { describe, expect, it } from "vitest";
import { DEFAULT_TEMPLATES, fillTemplate, normaliseTemplates, renderDelivery, TEMPLATE_PRESETS } from "./templates";
import { planReply } from "./responder";

describe("fillTemplate", () => {
  it("fills placeholders and drops lines whose link/video is missing", () => {
    const out = fillTemplate("Hi {name}! {title}\n\n{prompt}\n\n📄 {link}\n🔗 {video}", { name: "ravi", title: "Fable", prompt: "P" });
    expect(out).toBe("Hi @ravi! Fable\n\nP");
  });
  it("uses 'friend' when the name is unknown and skips a video link identical to the page link", () => {
    expect(fillTemplate("Hey {name} {link} | {video}", { title: "t", link: "https://a", video: "https://a" })).toBe("");
    expect(fillTemplate("Hey {name}", { title: "t" })).toBe("Hey friend");
  });
});

describe("renderDelivery", () => {
  it("cuts a long prompt to fit and still includes the page link", () => {
    const out = renderDelivery("{title}\n\n{prompt}", { title: "Big", prompt: "x".repeat(3000), link: "https://site/r/big" }, 1000);
    expect(out.length).toBeLessThanOrEqual(1000);
    expect(out).toContain("https://site/r/big");
  });
});

describe("normaliseTemplates", () => {
  it("falls back to defaults for missing or empty fields", () => {
    expect(normaliseTemplates(null)).toEqual(DEFAULT_TEMPLATES);
    const t = normaliseTemplates({ igDm: "  ", igPublicReplies: ["", "Sent!"], aiStyle: "Calm." });
    expect(t.igDm).toBe(DEFAULT_TEMPLATES.igDm);
    expect(t.igPublicReplies).toEqual(["Sent!"]);
    expect(t.aiStyle).toBe("Calm.");
  });
  it("every preset is complete", () => {
    for (const p of TEMPLATE_PRESETS) expect(normaliseTemplates(p.templates)).toEqual(p.templates);
  });
});

describe("planReply with custom templates", () => {
  it("uses the creator's wording", async () => {
    const plan = await planReply({
      comment: { platform: "INSTAGRAM", commentId: "c", text: "FABLE", authorName: "ravi" },
      library: {
        about: "",
        warnings: [],
        entries: [{ keyword: "FABLE", keywords: ["FABLE"], title: "Fable prompts", message: "PROMPT", url: "https://s/r/fable" }],
        templates: { ...DEFAULT_TEMPLATES, igPublicReplies: ["Check DMs {name} for {keyword}"], igDm: "Yo {name}: {prompt} -> {link}" },
      },
      llm: null,
      pick: () => 0,
    });
    expect(plan.publicReply).toBe("Check DMs @ravi for FABLE");
    expect(plan.privateReply).toBe("Yo @ravi: PROMPT -> https://s/r/fable");
  });
});

describe("general comments", () => {
  const base = { about: "", warnings: [], entries: [] };
  const yt = (text: string) => ({ platform: "YOUTUBE" as const, commentId: "c", text, authorName: "@ravi" });
  const ai = (reply: string) => ({ name: "fake", complete: async () => JSON.stringify({ action: "reply", reply }) });
  const skip = { name: "fake", complete: async () => JSON.stringify({ action: "skip", reason: "spam" }) };

  it("ai mode: the AI writes the thank-you", async () => {
    const plan = await planReply({ comment: yt("nice content bro"), library: { ...base, templates: { ...DEFAULT_TEMPLATES, generalMode: "ai" } }, llm: ai("Thanks Ravi, glad it helped!") });
    expect(plan).toEqual({ action: "GENERAL", publicReply: "Thanks Ravi, glad it helped!" });
  });
  it("fixed mode: uses the creator's line, and the AI still blocks spam", async () => {
    const templates = { ...DEFAULT_TEMPLATES, generalMode: "fixed" as const, generalReplies: ["Thanks {name}!"] };
    expect((await planReply({ comment: yt("nice content"), library: { ...base, templates }, llm: ai("whatever"), pick: () => 0 })).publicReply).toBe("Thanks @ravi!");
    expect((await planReply({ comment: yt("sub4sub check my channel"), library: { ...base, templates }, llm: skip })).action).toBe("NONE");
    expect((await planReply({ comment: yt("nice content"), library: { ...base, templates }, llm: null, pick: () => 0 })).publicReply).toBe("Thanks @ravi!");
  });
  it("fixed mode: questions still get a real AI answer", async () => {
    const templates = { ...DEFAULT_TEMPLATES, generalMode: "fixed" as const, generalReplies: ["Thanks!"] };
    const plan = await planReply({ comment: yt("what mic do you use?"), library: { ...base, templates }, llm: ai("A Shure MV7!") });
    expect(plan).toEqual({ action: "AI_ANSWER", publicReply: "A Shure MV7!" });
  });
  it("off mode: no reply and no AI call for general comments", async () => {
    let called = false;
    const llm = { name: "x", complete: async () => ((called = true), "{}") };
    const plan = await planReply({ comment: yt("nice content"), library: { ...base, templates: { ...DEFAULT_TEMPLATES, generalMode: "off" } }, llm });
    expect(plan.action).toBe("NONE");
    expect(called).toBe(false);
  });
});

describe("shared keywords", () => {
  it("a comment on a video gets that video's prompt when two videos share the keyword", async () => {
    const entries = [
      { keyword: "FABLE", keywords: ["FABLE"], title: "Short", message: "SHORT PROMPT", mediaIds: ["yt1"] },
      { keyword: "FABLE", keywords: ["FABLE"], title: "Reel", message: "REEL PROMPT", mediaIds: ["ig1"] },
    ];
    const plan = await planReply({
      comment: { platform: "INSTAGRAM", commentId: "c", text: "FABLE", authorName: "ravi", mediaId: "ig1" },
      library: { about: "", warnings: [], entries },
      llm: null,
      pick: () => 0,
    });
    expect(plan.privateReply).toContain("REEL PROMPT");
  });
});

describe("when the AI is busy", () => {
  const busy = { name: "busy", complete: async () => { throw new Error("The AI is busy right now"); } };
  const base = { about: "", warnings: [], entries: [{ keyword: "FABLE", keywords: ["FABLE"], title: "Fable", message: "PROMPT" }] };
  const yt = (text: string) => ({ platform: "YOUTUBE" as const, commentId: "c", text, authorName: "@kavya" });

  it("a general comment gets a thank-you line instead of failing", async () => {
    const plan = await planReply({ comment: yt("Game"), library: { ...base, templates: { ...DEFAULT_TEMPLATES, generalReplies: ["Thanks {name}!"] } }, llm: busy, pick: () => 0 });
    expect(plan).toEqual({ action: "GENERAL", publicReply: "Thanks @kavya!" });
  });
  it("a keyword with a question still gets the prompt", async () => {
    const plan = await planReply({ comment: yt("FABLE does this work on Windows?"), library: base, llm: busy });
    expect(plan.action).toBe("KEYWORD");
    expect(plan.publicReply).toContain("PROMPT");
  });
  it("a real question fails so it is retried later", async () => {
    await expect(planReply({ comment: yt("what mic do you use?"), library: base, llm: busy })).rejects.toThrow(/busy/);
  });
  it("general replies switched off: still no reply", async () => {
    const plan = await planReply({ comment: yt("Game"), library: { ...base, templates: { ...DEFAULT_TEMPLATES, generalMode: "off" } }, llm: busy });
    expect(plan.action).toBe("NONE");
  });
});
