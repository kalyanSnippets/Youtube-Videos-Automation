import type { AIGenerateRequest, AIGenerateResult, AIProvider } from "./types";

/**
 * MOCK provider - always available, never calls a real model. Used as the
 * default provider until OpenAI/Anthropic credentials are configured, and
 * always used for the seeded DEMO projects. The web UI must show a visible
 * "MOCK mode" badge whenever this provider is active so nobody mistakes
 * fixture data for a real research/generation result.
 */
export class MockAIProvider implements AIProvider {
  readonly id = "MOCK" as const;
  readonly label = "Mock Provider (no real AI call)";

  isAvailable(): boolean {
    return true;
  }

  async generate(request: AIGenerateRequest): Promise<AIGenerateResult> {
    return {
      provider: "MOCK",
      rawText: JSON.stringify({
        _mock: true,
        task: request.task,
        note: "This is fixture data from the MOCK provider. Connect an OpenAI or Anthropic API key in Settings > Integrations to run real agents.",
      }),
      tokensUsed: 0,
      costUsd: 0,
    };
  }
}
