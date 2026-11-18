import type { LibraryEntry } from "./types";

/** "#Fable!" -> "FABLE". Used when saving resources so keywords match consistently. */
export function normaliseKeyword(raw: string): string {
  return raw
    .normalize("NFKC")
    .replace(/^[#"'“”‘’\s]+|[#"'“”‘’\s.!?,;:]+$/g, "")
    .replace(/\s+/g, " ")
    .toUpperCase();
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Finds the library entry whose keyword appears in the comment as a whole word, ignoring case,
 * a leading # and surrounding punctuation/emoji. "fable!!", "#Fable", "FABLE please 🙏" all match
 * FABLE; "fables" and "unfabled" do not. Multi-word keywords match with any whitespace between words.
 * When several match, the earliest one in the comment wins.
 */
export function matchKeyword(commentText: string, entries: LibraryEntry[]): { entry: LibraryEntry; keyword: string } | null {
  const text = commentText.normalize("NFKC");
  let best: { entry: LibraryEntry; keyword: string; index: number } | null = null;
  for (const entry of entries) {
    for (const keyword of entry.keywords) {
      const pattern = keyword.split(" ").map(escapeRegExp).join("\\s+");
      const re = new RegExp(`(?<![\\p{L}\\p{N}_])#?${pattern}(?![\\p{L}\\p{N}_])`, "iu");
      const m = re.exec(text);
      if (m && (!best || m.index < best.index)) best = { entry, keyword, index: m.index };
    }
  }
  return best ? { entry: best.entry, keyword: best.keyword } : null;
}

/** The comment says more than just the keyword, and reads like a question. */
export function looksLikeQuestion(commentText: string, keyword?: string): boolean {
  let rest = commentText;
  if (keyword) rest = rest.replace(new RegExp(`#?${escapeRegExp(keyword).replace(/ /g, "\\s+")}`, "iu"), " ");
  rest = rest.trim();
  if (rest.split(/\s+/).filter(Boolean).length < 3) return false;
  return /\?/.test(rest) || /^(how|what|why|when|where|which|who|can|could|does|do|is|are|will|would|should)\b/i.test(rest);
}
