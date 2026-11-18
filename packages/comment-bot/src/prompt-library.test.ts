import { describe, expect, it } from "vitest";
import { extractGoogleDocId, loadPromptLibrary, parsePromptLibrary } from "./prompt-library";

const DOC = `﻿I'm Kalyan. I make AI tutorials in English.\r
FAQ: I use a MacBook Pro.\r
\r
KEYWORD: FABLE, fable5\r
TITLE: Fable 5.2 starter prompts\r
LINK: https://example.com/fable\r
MESSAGE:\r
Prompt 1: Explain like I'm five.\r
TITLE: this line is part of the message\r
\r
Prompt 2: Write a hook.\r
KEYWORD: SIM\r
MESSAGE: One-line prompt for SIM\r
KEYWORD: EMPTY\r
TITLE: nothing here\r
`;

describe("parsePromptLibrary", () => {
  const lib = parsePromptLibrary(DOC);

  it("collects the about text before the first keyword", () => {
    expect(lib.about).toBe("I'm Kalyan. I make AI tutorials in English.\nFAQ: I use a MacBook Pro.");
  });

  it("parses entries with aliases, title, link and multi-line message", () => {
    expect(lib.entries).toHaveLength(2);
    const fable = lib.entries[0]!;
    expect(fable.keyword).toBe("FABLE");
    expect(fable.keywords).toEqual(["FABLE", "FABLE5"]);
    expect(fable.title).toBe("Fable 5.2 starter prompts");
    expect(fable.link).toBe("https://example.com/fable");
    expect(fable.message).toBe("Prompt 1: Explain like I'm five.\nTITLE: this line is part of the message\n\nPrompt 2: Write a hook.");
    expect(lib.entries[1]).toMatchObject({ keyword: "SIM", title: "SIM", message: "One-line prompt for SIM" });
  });

  it("warns about entries without a message", () => {
    expect(lib.warnings.some((w) => w.includes("EMPTY"))).toBe(true);
  });
});

describe("extractGoogleDocId", () => {
  it("reads ids from the usual doc URLs", () => {
    expect(extractGoogleDocId("https://docs.google.com/document/d/1AbCdEfGhIjKlMnOpQrStUvWxYz12345/edit?usp=sharing")).toBe("1AbCdEfGhIjKlMnOpQrStUvWxYz12345");
    expect(extractGoogleDocId("https://docs.google.com/document/u/0/d/1AbCdEfGhIjKlMnOpQrStUvWxYz12345/view")).toBe("1AbCdEfGhIjKlMnOpQrStUvWxYz12345");
    expect(extractGoogleDocId("not a doc")).toBeNull();
  });
});

describe("loadPromptLibrary", () => {
  it("explains a private doc instead of parsing Google's sign-in page", async () => {
    const fetchImpl = (async () => new Response("<html>Sign in</html>", { status: 200 })) as typeof fetch;
    const lib = await loadPromptLibrary({ docUrl: "https://docs.google.com/document/d/1AbCdEfGhIjKlMnOpQrStUvWxYz12345/edit", fetchImpl, force: true });
    expect(lib.entries).toHaveLength(0);
    expect(lib.warnings[0]).toMatch(/Anyone with the link/);
  });
});
