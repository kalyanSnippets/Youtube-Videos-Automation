import type { AIGenerateRequest, AIGenerateResult, AIProvider } from "./types";

/**
 * Real Anthropic provider. Reads ANTHROPIC_API_KEY from the server
 * environment only. See OpenAIProvider for the same never-fabricate rule.
 */
export class AnthropicProvider implements AIProvider {
  readonly id = "ANTHROPIC" as const;
  readonly label = "Anthropic";

  private get apiKey(): string | undefined {
    return process.env.ANTHROPIC_API_KEY;
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey);
  }

  async generate(request: AIGenerateRequest): Promise<AIGenerateResult> {
    if (!this.apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not configured. Connect it in Settings > Integrations.");
    }
    const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: request.maxOutputTokens ?? 4096,
        // `temperature` is rejected outright by claude-sonnet-5 ("deprecated for this
        // model") - omit it rather than pin a value the API will 400 on.
        system: request.systemPrompt,
        messages: [
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
      throw new Error(`Anthropic request failed (${response.status}): ${body}`);
    }
    const json = (await response.json()) as {
      content: { type: string; text?: string }[];
      usage?: { input_tokens?: number; output_tokens?: number };
    };
    const text = json.content.find((c) => c.type === "text")?.text ?? "";
    const tokensUsed = (json.usage?.input_tokens ?? 0) + (json.usage?.output_tokens ?? 0);
    return { provider: "ANTHROPIC", rawText: text, tokensUsed };
  }
}
