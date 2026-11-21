import { normaliseKeyword } from "@yaos/comment-bot";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export type PromptSource = "google-doc" | "docx" | "pdf" | "text";

export interface ImportedPrompt {
  text: string;
  source: PromptSource;
  filename: string | null;
  /** Set when the first line was "KEYWORD: EDIT" (or similar). */
  keyword: string | null;
}

/** "KEYWORD: EDIT" as the first line sets the keyword and is removed from the prompt. */
export function takeKeywordLine(text: string): { keyword: string | null; text: string } {
  const lines = text.replace(/^﻿/, "").replace(/\r\n?/g, "\n").split("\n");
  const firstIndex = lines.findIndex((l) => l.trim() !== "");
  if (firstIndex === -1) return { keyword: null, text: "" };
  const match = lines[firstIndex]!.match(/^\s*KEYWORDS?\s*:\s*(.+)$/i);
  if (!match) return { keyword: null, text: text.trim() };
  const keyword = normaliseKeyword(match[1]!.split(/[,/|]/)[0] ?? "") || null;
  const rest = lines.slice(firstIndex + 1).join("\n").trim();
  return { keyword, text: rest };
}

/** Turns extracted text into tidy plain text: normalised line endings, no runs of blank lines. */
export function tidy(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function googleDocId(url: string): string | null {
  const m = url.trim().match(/\/document\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]{20,})/);
  return m?.[1] ?? null;
}

export async function fetchGoogleDoc(url: string): Promise<string> {
  const id = googleDocId(url);
  if (!id) throw new Error("That doesn't look like a Google Docs link. Paste the full link from the address bar.");
  const res = await fetch(`https://docs.google.com/document/d/${id}/export?format=txt`, { redirect: "follow" });
  const body = await res.text();
  if (!res.ok || /<html/i.test(body.slice(0, 300))) {
    throw new Error(
      'Google wouldn\'t share that doc. In Google Docs choose Share → General access → "Anyone with the link" → Viewer, then try again. Or download it as .docx and upload the file.',
    );
  }
  return body;
}

/** Reads an uploaded file (.docx, .pdf, .txt, .md) into plain text. */
export async function readUpload(file: File): Promise<ImportedPrompt> {
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("That file is over 5 MB. Export a smaller file and try again.");
  const name = file.name || "upload";
  const lower = name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());
  let raw: string;
  let source: PromptSource;
  if (lower.endsWith(".docx")) {
    const mammoth = (await import("mammoth")).default;
    raw = (await mammoth.extractRawText({ buffer })).value;
    source = "docx";
  } else if (lower.endsWith(".pdf")) {
    const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
    raw = (await pdfParse(buffer)).text;
    source = "pdf";
    if (!raw.trim()) throw new Error("No text found in that PDF. It may be a scan; try the Word or Google Doc version instead.");
  } else if (lower.endsWith(".txt") || lower.endsWith(".md")) {
    raw = buffer.toString("utf8");
    source = "text";
  } else {
    throw new Error("Upload a Word (.docx), PDF, text (.txt) or Markdown (.md) file, or paste a Google Doc link.");
  }
  const { keyword, text } = takeKeywordLine(tidy(raw));
  return { text, source, filename: name, keyword };
}

const FILE_TYPES: Record<string, string> = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pdf: "application/pdf",
  txt: "text/plain; charset=utf-8",
  md: "text/markdown; charset=utf-8",
};

/** Checks an uploaded document before it's kept as the video's download. */
export async function readAttachment(file: File): Promise<{ name: string; type: string; size: number; base64: string }> {
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("That file is over 5 MB. Export a smaller file and try again.");
  const name = (file.name || "prompt").replace(/[\\/\r\n"]/g, "_").slice(0, 300);
  const ext = name.toLowerCase().split(".").pop() ?? "";
  const type = FILE_TYPES[ext];
  if (!type) throw new Error("Upload a Word (.docx), PDF, text (.txt) or Markdown (.md) file.");
  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  return { name, type, size: file.size, base64 };
}
