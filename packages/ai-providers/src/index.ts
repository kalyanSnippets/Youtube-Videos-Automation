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

/**
 * Resolve the provider to use: the requested one if configured; otherwise the first
 * configured real provider (Anthropic, then OpenAI); otherwise MOCK. A configured API
 * key is meant to be used automatically - nothing in the app lets a user pick a
 * "preferred provider" per call, so defaulting to MOCK whenever one isn't explicitly
 * requested would silently ignore a real key. MOCK is the true no-op fallback, only
 * reached when no real provider is configured at all.
 */
export function resolveAIProvider(preferred?: AIProviderId): AIProvider {
  if (preferred && providers[preferred].isAvailable()) {
    return providers[preferred];
  }
  const fallbackOrder: AIProviderId[] = ["ANTHROPIC", "OPENAI"];
  const firstAvailable = fallbackOrder.find((id) => providers[id].isAvailable());
  return firstAvailable ? providers[firstAvailable] : providers.MOCK;
}

export function getAllProviders(): AIProvider[] {
  return Object.values(providers);
}
