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
