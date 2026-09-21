/**
 * Extracts a JSON object/array from a model response, tolerating markdown code fences -
 * including an unclosed opening fence (a response cut off before the closing ``` still has
 * a shot at parsing once the fence marker itself is stripped, rather than failing outright
 * on the literal backtick).
 */
export function parseJsonLoose(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return JSON.parse(fenced[1].trim());
  const openFence = text.match(/^```(?:json)?\s*/i);
  const candidate = openFence ? text.slice(openFence[0].length) : text;
  return JSON.parse(candidate.trim());
}
