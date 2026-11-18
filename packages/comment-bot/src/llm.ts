import { resolveAIProvider } from "@yaos/ai-providers";

/**
 * Minimal text-in/text-out LLM call for the bot. Order: Gemini (has a free tier, so it is the
 * suggested key for a new channel), then the app's existing Anthropic/OpenAI providers.
 * Returns null when no real provider is configured: the bot then still answers keywords
 * but skips free-form questions rather than posting canned filler.
 */
export interface LLM {
  readonly name: string;
  complete(system: string, user: string): Promise<string>;
}

export function geminiLLM(apiKey: string, model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash"): LLM {
  return {
    name: `gemini:${model}`,
    async complete(system, user) {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: user }] }],
          generationConfig: { responseMimeType: "application/json", maxOutputTokens: 1024, temperature: 0.7 },
        }),
      });
      if (!response.ok) throw new Error(`Gemini request failed (${response.status}): ${(await response.text()).slice(0, 300)}`);
      const json = (await response.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      return json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    },
  };
}

export function resolveLLM(): LLM | null {
  if (process.env.GEMINI_API_KEY) return geminiLLM(process.env.GEMINI_API_KEY);
  const provider = resolveAIProvider();
  if (provider.id === "MOCK") return null;
  return {
    name: provider.id.toLowerCase(),
    async complete(system, user) {
      const result = await provider.generate({ task: "comment-reply", systemPrompt: system, userPrompt: user, maxOutputTokens: 1024 });
      return result.rawText;
    },
  };
}
