import sanitizeHtml from "sanitize-html";
import { marked } from "marked";

/**
 * Turns a creator's resource into safe, formatted HTML for the video page: Word documents keep
 * their headings, lists, bold text, tables and links; Markdown and plain text are laid out the same
 * way. Everything passes through an allowlist, so a document can't inject scripts into the site.
 */
const ALLOWED: sanitizeHtml.IOptions = {
  allowedTags: [
    "h1", "h2", "h3", "h4", "h5", "h6", "p", "br", "hr", "strong", "b", "em", "i", "u", "s", "sub", "sup",
    "ul", "ol", "li", "blockquote", "pre", "code", "a", "table", "thead", "tbody", "tr", "th", "td", "img", "span",
  ],
  allowedAttributes: { a: ["href", "title"], img: ["src", "alt"], td: ["colspan", "rowspan"], th: ["colspan", "rowspan"] },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["data", "https"] },
  transformTags: { a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener nofollow" }) },
};

export function cleanHtml(html: string): string {
  return sanitizeHtml(html, { ...ALLOWED, allowedAttributes: { ...ALLOWED.allowedAttributes, a: ["href", "title", "target", "rel"] } });
}

/** Word (.docx) -> formatted HTML. Paragraphs styled as code become copyable code blocks. */
export async function docxToHtml(buffer: Buffer): Promise<string> {
  const mammoth = (await import("mammoth")).default;
  const result = await mammoth.convertToHtml(
    { buffer },
    {
      styleMap: [
        "p[style-name='Code'] => pre:separator('\\n')",
        "p[style-name='Code Block'] => pre:separator('\\n')",
        "p[style-name='HTML Preformatted'] => pre:separator('\\n')",
        "r[style-name='Code Char'] => code",
        "p[style-name='Title'] => h1:fresh",
        "p[style-name='Subtitle'] => h2:fresh",
      ],
    },
  );
  return cleanHtml(result.value);
}

/** Markdown (or plain text, which reads fine as Markdown) -> formatted HTML. */
export function markdownToHtml(text: string): string {
  return cleanHtml(marked.parse(text, { async: false, gfm: true, breaks: true }) as string);
}
