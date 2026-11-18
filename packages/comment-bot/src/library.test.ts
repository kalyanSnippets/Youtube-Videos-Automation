import { describe, expect, it } from "vitest";
import { toLibrary } from "./library";

const row = (over: Record<string, unknown>) =>
  ({
    id: "1", slug: "fable", title: "Fable", keywords: ["FABLE"], summary: null, body: "PROMPT", link: null, videoUrl: null,
    published: true, sortOrder: 0, views: 0, createdAt: new Date(), updatedAt: new Date(), ...over,
  }) as never;

describe("toLibrary", () => {
  it("builds entries with page links and skips unpublished or keyword-less resources", () => {
    const lib = toLibrary(
      [row({}), row({ id: "2", slug: "draft", title: "Draft", keywords: ["DRAFT"], published: false }), row({ id: "3", slug: "nokw", title: "No kw", keywords: [] })],
      "About me",
      "https://site.example",
    );
    expect(lib.entries).toEqual([{ keyword: "FABLE", keywords: ["FABLE"], title: "Fable", link: undefined, message: "PROMPT", url: "https://site.example/r/fable" }]);
    expect(lib.warnings).toEqual([]);
  });
  it("warns about duplicate keywords and empty about notes", () => {
    const lib = toLibrary([row({}), row({ id: "2", slug: "b", title: "Other", keywords: ["FABLE", "B"] })], "", "https://s");
    expect(lib.entries[1]?.keywords).toEqual(["B"]);
    expect(lib.warnings.join(" ")).toMatch(/FABLE is on both/);
    expect(lib.warnings.join(" ")).toMatch(/About me/);
  });
});
