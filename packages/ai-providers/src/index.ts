export * from "./types";
export * from "./mock-provider";
export * from "./openai-provider";
export * from "./anthropic-provider";

import type { AIProvider, AIProviderId } from "./types";
import { MockAIProvider } from "./mock-provider";
import { OpenAIProvider } from "./openai-provider";
import { AnthropicProvider } from "./anthropic-provider";

const providers: Record<AIProviderId, AIProvider> = {
  MOCK: new MockAIProvider(),
  OPENAI: new OpenAIProvider(),
  ANTHROPIC: new AnthropicProvider(),
};

/** Resolve the provider to use: the requested one if configured, otherwise MOCK (never silently fabricate under a real provider's name). */
export function resolveAIProvider(preferred?: AIProviderId): AIProvider {
  if (preferred && providers[preferred].isAvailable()) {
    return providers[preferred];
  }
  return providers.MOCK;
}

export function getAllProviders(): AIProvider[] {
  return Object.values(providers);
}
