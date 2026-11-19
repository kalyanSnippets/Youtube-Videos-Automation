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

/** Default Gemini model. Override with GEMINI_MODEL. Google retires models often; see geminiLLM's fallback. */
export const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";

/** When Google retires a model it answers 404 and names the replacement ("...use models/gemini-x-flash..."). */
export function replacementModelFrom404(body: string): string | null {
  return body.match(/use models\/([\w.-]+)/i)?.[1] ?? null;
}

/** How long one AI call may take. Netlify stops a request after ~10 seconds, so keep well inside that. */
export const AI_TIMEOUT_MS = Number(process.env.COMMENT_BOT_AI_TIMEOUT_MS ?? 7000);

/**
 * Newer Gemini models "think" before answering, which is slow and can eat the whole output budget.
 * Ask for minimal thinking; older models reject the newer setting, so fall back step by step.
 */
const THINKING_OPTIONS: (Record<string, unknown> | null)[] = [{ thinkingLevel: "minimal" }, { thinkingBudget: 0 }, null];
let thinkingChoice = 0;

async function geminiCall(apiKey: string, model: string, system: string, user: string): Promise<Response> {
  for (let i = thinkingChoice; i < THINKING_OPTIONS.length; i++) {
    const thinking = THINKING_OPTIONS[i];
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      signal: AbortSignal.timeout(AI_TIMEOUT_MS),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens: 2048,
          ...(thinking ? { thinkingConfig: thinking } : {}),
        },
      }),
    }).catch((error: Error) => {
      if (error.name === "TimeoutError" || error.name === "AbortError") throw new Error(`The AI took longer than ${AI_TIMEOUT_MS / 1000}s to answer.`);
      throw error;
    });
    if (res.status === 400 && i < THINKING_OPTIONS.length - 1) {
      const body = await res.clone().text();
      if (/thinking/i.test(body)) {
        thinkingChoice = i + 1; // remember what this model accepts
        continue;
      }
    }
    return res;
  }
  throw new Error("Gemini rejected every request format.");
}

export function geminiLLM(apiKey: string, model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL): LLM {
  let activeModel = model;
  return {
    get name() {
      return `gemini:${activeModel}`;
    },
    async complete(system, user) {
      let response = await geminiCall(apiKey, activeModel, system, user);
      if (response.status === 404) {
        // Model retired: switch to the replacement Google names (and keep using it), so the bot heals itself.
        const replacement = replacementModelFrom404(await response.text());
        if (!replacement || replacement === activeModel) throw new Error(`Gemini model ${activeModel} not found. Set GEMINI_MODEL to a current model.`);
        console.warn(`[comment-bot] Gemini model ${activeModel} retired; using ${replacement}. Set GEMINI_MODEL=${replacement} to silence this.`);
        activeModel = replacement;
        response = await geminiCall(apiKey, activeModel, system, user);
      }
      if (!response.ok) throw new Error(`Gemini request failed (${response.status}): ${(await response.text()).slice(0, 300)}`);
      const json = (await response.json()) as { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[] };
      // Skip "thought" parts some newer models return before the answer.
      return json.candidates?.[0]?.content?.parts?.filter((p) => !p.thought).map((p) => p.text ?? "").join("") ?? "";
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
