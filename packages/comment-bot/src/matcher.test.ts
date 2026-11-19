import { describe, expect, it } from "vitest";
import { looksLikeQuestion, matchKeyword, normaliseKeyword, splitKeywords } from "./matcher";
import type { LibraryEntry } from "./types";

const entries: LibraryEntry[] = [
  { keyword: "FABLE", keywords: ["FABLE", "FABLE5"], title: "Fable", message: "m1" },
  { keyword: "CLAUDE CODE", keywords: ["CLAUDE CODE"], title: "CC", message: "m2" },
];

describe("matchKeyword", () => {
  it.each(["FABLE", "fable", "Fable!!", "#fable please 🙏", "pls send FABLE5", "🔥fable🔥"])("matches %s", (c) => {
    expect(matchKeyword(c, entries)).not.toBeNull();
  });
  it.each(["unfabled", "fabulous work", "great video", ""])("does not match %s", (c) => {
    expect(matchKeyword(c, entries)).toBeNull();
  });
  it("matches multi-word keywords across extra spaces", () => {
    expect(matchKeyword("claude   code pls", entries)?.entry.keyword).toBe("CLAUDE CODE");
  });
  it("prefers the keyword that appears first", () => {
    expect(matchKeyword("claude code and fable", entries)?.entry.keyword).toBe("CLAUDE CODE");
  });
});

describe("looksLikeQuestion", () => {
  it("ignores a bare keyword", () => expect(looksLikeQuestion("FABLE", "FABLE")).toBe(false));
  it("spots a question next to the keyword", () => expect(looksLikeQuestion("FABLE does this work on Windows?", "FABLE")).toBe(true));
  it("spots a question without a question mark", () => expect(looksLikeQuestion("how do I install it on mac")).toBe(true));
  it("treats praise as not a question", () => expect(looksLikeQuestion("FABLE love this video bro", "FABLE")).toBe(false));
});

describe("normaliseKeyword", () => {
  it("cleans keywords typed in the editor", () => {
    expect(normaliseKeyword("  #fable! ")).toBe("FABLE");
    expect(normaliseKeyword("claude   code")).toBe("CLAUDE CODE");
  });
});

describe("keywords typed in any case", () => {
  const game: LibraryEntry[] = [{ keyword: "GAME", keywords: ["GAME"], title: "Game", message: "PROMPT" }];
  it.each(["Game", "game", "GAME", "gAmE", "#game", "game 🔥", "GAME!!", "Games", "send me the game prompt pls"])("%s matches GAME", (c) => {
    expect(matchKeyword(c, game)?.entry.keyword).toBe("GAME");
  });
  it.each(["nice", "not bad", "great content", "gamer life", "endgame"])("%s does not match GAME", (c) => {
    expect(matchKeyword(c, game)).toBeNull();
  });
});

describe("splitKeywords", () => {
  it("splits, cleans and de-duplicates a keyword box", () => {
    expect(splitKeywords("GAME, GAME")).toEqual(["GAME"]);
    expect(splitKeywords("game, #Games / my game")).toEqual(["GAME", "GAMES", "MY GAME"]);
    expect(splitKeywords("")).toEqual([]);
    expect(splitKeywords(null)).toEqual([]);
  });
});
