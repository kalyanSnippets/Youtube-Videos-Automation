/**
 * Whether a video gives away a prompt (text you paste into an AI) or a resource (a guide, setup
 * steps, a template, a file). Used for wording: "Copy prompt" vs "Copy", "the prompt you asked
 * for" vs "the resource you asked for". The creator can set it per video; otherwise it's guessed.
 */
export type ContentKind = "prompt" | "resource";

export function resolveContentKind(v: { contentKind?: string | null; attachmentName?: string | null; prompt?: string | null }): ContentKind {
  if (v.contentKind === "prompt" || v.contentKind === "resource") return v.contentKind;
  if (v.attachmentName) return "resource"; // an uploaded guide or document
  const text = (v.prompt ?? "").trim();
  if (!text) return "prompt";
  // Prompts talk to the AI ("You are…", "Act as…"); long multi-step text is usually a guide.
  if (/^(you are|act as|i want you to|your task|imagine you|pretend you|role:|system:)/i.test(text.slice(0, 200))) return "prompt";
  const steps = (text.match(/^\s*(\d+[.)]|step \d+|#{1,3} )/gim) ?? []).length;
  return text.length > 3000 || steps >= 4 ? "resource" : "prompt";
}
