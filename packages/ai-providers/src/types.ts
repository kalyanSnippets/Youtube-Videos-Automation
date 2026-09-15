export type AIProviderId = "MOCK" | "OPENAI" | "ANTHROPIC";

export interface AIGenerateRequest {
  /** Agent/task identifier, used by the MOCK provider to pick canned fixtures and for logging. */
  task: string;
  systemPrompt: string;
  userPrompt: string;
  /** JSON schema (as text) the model is asked to conform to. Providers that support native structured output should use it directly. */
  jsonSchemaHint?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface AIGenerateResult {
  provider: AIProviderId;
  rawText: string;
  tokensUsed?: number;
  costUsd?: number;
}

/**
 * Every LLM call in the system goes through this interface. Business logic
 * (agents) never imports an SDK directly - it depends on AIProvider so the
 * MOCK provider is a drop-in replacement when no API key is configured.
 */
export interface AIProvider {
  readonly id: AIProviderId;
  readonly label: string;
  isAvailable(): boolean;
  generate(request: AIGenerateRequest): Promise<AIGenerateResult>;
}
