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

/** Total time the bot gives the AI for one comment. Netlify stops a request after ~10 seconds. */
export const AI_TIMEOUT_MS = Number(process.env.COMMENT_BOT_AI_TIMEOUT_MS ?? 7500);

/**
 * Lighter Gemini models to try when the main one is overloaded (503), rate-limited (429) or slow.
 * Google keeps the "-latest" aliases pointed at current models. Override with GEMINI_FALLBACK_MODELS
 * (comma separated). Unknown names are skipped.
 */
export const DEFAULT_FALLBACK_MODELS = ["gemini-flash-lite-latest", "gemini-flash-latest"];

/**
 * Newer Gemini models "think" before answering, which is slow and can eat the whole output budget.
 * Ask for minimal thinking; older models reject the newer setting, so fall back step by step
 * (remembered per model).
 */
const THINKING_OPTIONS: (Record<string, unknown> | null)[] = [{ thinkingLevel: "minimal" }, { thinkingBudget: 0 }, null];
const thinkingChoice = new Map<string, number>();

class AITimeout extends Error {}

async function geminiCall(apiKey: string, model: string, system: string, user: string, timeoutMs: number): Promise<Response> {
  for (let i = thinkingChoice.get(model) ?? 0; i < THINKING_OPTIONS.length; i++) {
    const thinking = THINKING_OPTIONS[i];
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      signal: AbortSignal.timeout(timeoutMs),
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
      if (error.name === "TimeoutError" || error.name === "AbortError") throw new AITimeout(`${model} took too long`);
      throw error;
    });
    if (res.status === 400 && i < THINKING_OPTIONS.length - 1) {
      const body = await res.clone().text();
      if (/thinking/i.test(body)) {
        thinkingChoice.set(model, i + 1);
        continue;
      }
    }
    return res;
  }
  throw new Error("Gemini rejected every request format.");
}


/** Overloaded, rate-limited or a temporary server problem: worth trying another model. */
function isBusy(status: number): boolean {
  return status === 429 || status === 500 || status === 503 || status === 504;
}

export function geminiLLM(
  apiKey: string,
  model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
  fallbacks = (process.env.GEMINI_FALLBACK_MODELS ?? "").split(",").map((m) => m.trim()).filter(Boolean),
): LLM {
  let activeModel = model;
  const backups = fallbacks.length ? fallbacks : DEFAULT_FALLBACK_MODELS;
  return {
    get name() {
      return `gemini:${activeModel}`;
    },
    async complete(system, user) {
      const deadline = Date.now() + AI_TIMEOUT_MS;
      const queue = [activeModel, ...backups.filter((m) => m !== activeModel)];
      const problems: string[] = [];
      for (let i = 0; i < queue.length; i++) {
        let current = queue[i]!;
        const left = deadline - Date.now();
        if (left < 1200) break;
        // The main model gets most of the time; backups share what's left.
        const budget = i === 0 ? Math.min(left - 1500, 5000) : left;
        try {
          let response = await geminiCall(apiKey, current, system, user, Math.max(budget, 1000));
          if (response.status === 404) {
            const replacement = replacementModelFrom404(await response.text());
            if (i === 0 && replacement && replacement !== current) {
              // Main model retired: switch to the replacement Google names, and keep using it.
              console.warn(`[comment-bot] Gemini model ${current} retired; using ${replacement}. Set GEMINI_MODEL=${replacement} to silence this.`);
              activeModel = current = replacement;
              response = await geminiCall(apiKey, current, system, user, Math.max(deadline - Date.now() - 500, 1000));
            } else {
              problems.push(`${current}: not available`);
              continue;
            }
          }
          if (isBusy(response.status)) {
            problems.push(`${current}: busy (${response.status})`);
            continue;
          }
          if (!response.ok) throw new Error(`Gemini request failed (${response.status}): ${(await response.text()).slice(0, 300)}`);
          const json = (await response.json()) as { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[] };
          // Skip "thought" parts some newer models return before the answer.
          return json.candidates?.[0]?.content?.parts?.filter((p) => !p.thought).map((p) => p.text ?? "").join("") ?? "";
        } catch (error) {
          if (error instanceof AITimeout) {
            problems.push(error.message);
            continue;
          }
          throw error;
        }
      }
      throw new AIUnavailableError(`The AI is busy right now (${problems.join("; ") || "out of time"}). It will be retried.`);
    },
  };
}

/** Every AI model was busy or too slow. Callers can fall back to non-AI replies. */
export class AIUnavailableError extends Error {}

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
