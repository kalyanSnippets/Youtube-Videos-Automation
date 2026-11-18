import { describe, expect, it } from "vitest";
import { looksLikeQuestion, matchKeyword } from "./matcher";
import type { LibraryEntry } from "./types";

const entries: LibraryEntry[] = [
  { keyword: "FABLE", keywords: ["FABLE", "FABLE5"], title: "Fable", message: "m1" },
  { keyword: "CLAUDE CODE", keywords: ["CLAUDE CODE"], title: "CC", message: "m2" },
];

describe("matchKeyword", () => {
  it.each(["FABLE", "fable", "Fable!!", "#fable please 🙏", "pls send FABLE5", "🔥fable🔥"])("matches %s", (c) => {
    expect(matchKeyword(c, entries)).not.toBeNull();
  });
  it.each(["fables are fun", "unfabled", "great video", ""])("does not match %s", (c) => {
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
