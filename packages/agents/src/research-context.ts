import { resolveResearchProvider } from "@yaos/research";

/**
 * Fetches real web search results for a topic and formats them as prompt context,
 * or returns an empty string if research isn't connected or the search fails - agents
 * must degrade gracefully to their pre-research behavior rather than crash a run over
 * a flaky search API.
 */
export async function buildWebSearchContext(topic: string, instruction: string): Promise<string> {
  const provider = resolveResearchProvider();
  if (!provider.isAvailable()) return "";

  try {
    const result = await provider.webSearch(topic);
    if (result.sources.length === 0) return "";
    const list = result.sources
      .map((s, i) => `${i + 1}. "${s.title}" (${s.url})${s.publishedDate ? ` - ${s.publishedDate}` : ""}\n   ${s.relevance ?? ""}`)
      .join("\n");
    return `\n\nReal, current web search results for this topic. ${instruction}:\n${list}`;
  } catch (err) {
    console.warn(`Web search failed, continuing without real-research grounding: ${err instanceof Error ? err.message : String(err)}`);
    return "";
  }
}
