export interface PromptVersion {
  agent: string;
  version: number;
  createdAt: string;
  active: boolean;
  systemPrompt: string;
}

/** Returns the active prompt version for an agent, or the highest version if none is explicitly marked active. */
export function getActivePrompt(versions: PromptVersion[]): PromptVersion {
  const active = versions.find((v) => v.active);
  if (active) return active;
  return [...versions].sort((a, b) => b.version - a.version)[0];
}
