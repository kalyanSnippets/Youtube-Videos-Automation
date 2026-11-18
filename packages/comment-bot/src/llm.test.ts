import { afterEach, describe, expect, it, vi } from "vitest";
import { geminiLLM, replacementModelFrom404 } from "./llm";

const RETIRED =
  '{"error":{"code":404,"message":"This model models/gemini-2.5-flash is no longer available to new users. Please update your code to use models/gemini-3.8-flash for the latest features and improvements."}}';

afterEach(() => vi.unstubAllGlobals());

describe("gemini model fallback", () => {
  it("reads the replacement model from Google's 404", () => {
    expect(replacementModelFrom404(RETIRED)).toBe("gemini-3.8-flash");
    expect(replacementModelFrom404("not found")).toBeNull();
  });

  it("retries once with the replacement and keeps using it", async () => {
    const calls: string[] = [];
    vi.stubGlobal("fetch", async (url: string) => {
      calls.push(url.match(/models\/([^:]+)/)![1]!);
      if (url.includes("gemini-2.5-flash")) return new Response(RETIRED, { status: 404 });
      return Response.json({ candidates: [{ content: { parts: [{ text: "thinking", thought: true }, { text: '{"action":"skip"}' }] } }] });
    });
    const llm = geminiLLM("k", "gemini-2.5-flash");
    expect(await llm.complete("s", "u")).toBe('{"action":"skip"}');
    expect(await llm.complete("s", "u")).toBe('{"action":"skip"}');
    expect(calls).toEqual(["gemini-2.5-flash", "gemini-3.8-flash", "gemini-3.8-flash"]);
    expect(llm.name).toBe("gemini:gemini-3.8-flash");
  });
});
