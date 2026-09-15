import type { AIGenerateRequest, AIGenerateResult, AIProvider } from "./types";

/**
 * Real OpenAI provider. Reads OPENAI_API_KEY from the server environment
 * only - never expose it to the client. isAvailable() is false (and callers
 * must fall back to MOCK) whenever the key is absent; we never fabricate a
 * response when the integration isn't configured.
 */
export class OpenAIProvider implements AIProvider {
  readonly id = "OPENAI" as const;
  readonly label = "OpenAI";

  private get apiKey(): string | undefined {
    return process.env.OPENAI_API_KEY;
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey);
  }

  async generate(request: AIGenerateRequest): Promise<AIGenerateResult> {
    if (!this.apiKey) {
      throw new Error("OPENAI_API_KEY is not configured. Connect it in Settings > Integrations.");
    }
    const model = process.env.OPENAI_MODEL ?? "gpt-4.1";
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: request.temperature ?? 0.4,
        max_tokens: request.maxOutputTokens ?? 4096,
        messages: [
          { role: "system", content: request.systemPrompt },
          {
            role: "user",
            content: request.jsonSchemaHint
              ? `${request.userPrompt}\n\nRespond ONLY with JSON matching this shape:\n${request.jsonSchemaHint}`
              : request.userPrompt,
          },
        ],
      }),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenAI request failed (${response.status}): ${body}`);
    }
    const json = (await response.json()) as {
      choices: { message: { content: string } }[];
      usage?: { total_tokens?: number };
    };
    return {
      provider: "OPENAI",
      rawText: json.choices[0]?.message.content ?? "",
      tokensUsed: json.usage?.total_tokens,
    };
  }
}
