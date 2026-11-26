import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { bestMatches, keywordsFromCalls, matchScore, parseUploadPackage } from "./upload-package";

const realPackage = readFileSync(new URL("../../../reels/UPLOAD_PACKAGE.md", import.meta.url), "utf8");

describe("parseUploadPackage", () => {
  it("finds the EDIT reel and its promised prompt in a real package", () => {
    const { posts, skipped } = parseUploadPackage(realPackage);
    const edit = posts.find((p) => p.keywords.includes("EDIT"));
    expect(edit).toBeDefined();
    expect(edit!.prompt).toMatch(/^You are a meticulous video editor/);
    expect(edit!.prompt).toContain("top 3 fixes");
    expect(edit!.youtubeTitle).toMatch(/GPT-6\.1 Terra/);
    expect(edit!.promptName).toMatch(/video-review prompt/i);
    const fable = posts.find((p) => p.keywords.includes("FABLE"));
    expect(fable?.prompt).toMatch(/^Hey! Here are my 3 Claude Fable 5\.2 prompts/);
    // Polls like "comment ROBOT / DRAGON" have no prompt, so they're reported, not imported.
    expect(posts.every((p) => p.prompt)).toBe(true);
    expect(skipped.every((s) => s.reason)).toBe(true);
  });

  it("reads the explicit block exactly", () => {
    const md = [
      "## Reel 1: Game builder",
      "**YouTube title:** `I Built a Game With One Prompt #shorts`",
      "**Instagram caption**",
      "```",
      "One prompt, one full game 🎮 Comment GAME for the prompt",
      "```",
      "**Comment keyword:** GAME, GAMES",
      "**Prompt name:** One-prompt game builder",
      "**Prompt to send:**",
      "```",
      "You are a game designer.",
      "Build a full browser game.",
      "```",
      "**Link:** https://example.com/tool",
      "",
      "## Reel 2: No offer",
      "**YouTube title:** `Just news #shorts`",
    ].join("\n");
    const { posts } = parseUploadPackage(md);
    expect(posts).toHaveLength(1);
    expect(posts[0]).toMatchObject({
      label: "Reel 1: Game builder",
      youtubeTitle: "I Built a Game With One Prompt #shorts",
      keywords: ["GAME", "GAMES"],
      promptName: "One-prompt game builder",
      prompt: "You are a game designer.\nBuild a full browser game.",
      extraLink: "https://example.com/tool",
    });
    expect(posts[0]!.instagramCaption).toMatch(/^One prompt, one full game/);
  });

  it("only treats real calls to action as keywords", () => {
    expect(keywordsFromCalls('Comment "EDIT" and I\'ll DM you')).toEqual(["EDIT"]);
    expect(keywordsFromCalls("comment GAME for the prompt")).toEqual(["GAME"]);
    expect(keywordsFromCalls("Comment below 👇 which one")).toEqual([]);
  });
});

describe("matching", () => {
  const post = {
    label: "Reel 4: GPT-6.1 Terra",
    youtubeTitle: "This AI Can Review an Entire Movie (GPT-6.1 Terra) #shorts",
    instagramCaption: "This AI just reviewed an ENTIRE movie, scene by scene 🎬\n\nOpenAI's GPT-6.1 Terra can use real apps",
    keywords: ["EDIT"],
    promptName: null,
    prompt: "x",
    extraLink: null,
  };
  const videos = [
    { id: "y1", platform: "YOUTUBE", title: "This AI Can Review an Entire Movie (GPT-6.1 Terra) #shorts", description: null },
    { id: "y2", platform: "YOUTUBE", title: "Google Genie 4 lets you walk inside a prompt", description: null },
    { id: "i1", platform: "INSTAGRAM", title: "This AI just reviewed an ENTIRE movie, scene by scene 🎬", description: "This AI just reviewed an ENTIRE movie, scene by scene 🎬 OpenAI's GPT-6.1 Terra can use real apps" },
    { id: "i2", platform: "INSTAGRAM", title: "Type one prompt and walk inside the world", description: "Genie 4" },
  ];
  it("picks the right video on each platform", () => {
    expect(bestMatches(post, videos).map((v) => v.id)).toEqual(["y1", "i1"]);
  });
  it("doesn't match an unrelated video", () => {
    expect(matchScore(post, videos[1]!)).toBeLessThan(0.6);
    expect(bestMatches(post, [videos[1]!, videos[3]!])).toEqual([]);
  });
});
