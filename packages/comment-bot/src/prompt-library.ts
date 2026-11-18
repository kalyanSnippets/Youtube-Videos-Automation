import type { LibraryEntry, PromptLibrary } from "./types";

/**
 * The prompt library lives in a Google Doc so it can be edited from a phone without a deploy.
 * The doc must be shared as "Anyone with the link can view"; it is read through Google's plain
 * text export, so no Google API credentials are needed.
 *
 * Format (see docs/COMMENT-BOT.md):
 *
 *   Anything before the first KEYWORD line is "about" text for the AI.
 *
 *   KEYWORD: FABLE, FABLE5
 *   TITLE: Fable 5.2 starter prompts
 *   LINK: https://example.com/optional
 *   MESSAGE:
 *   The prompt text, as many lines as you like...
 *
 *   KEYWORD: NEXT ...
 */

export function extractGoogleDocId(urlOrId: string): string | null {
  const trimmed = urlOrId.trim();
  const fromUrl = trimmed.match(/\/document\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]{20,})/);
  if (fromUrl) return fromUrl[1]!;
  if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) return trimmed;
  return null;
}

export function googleDocExportUrl(docId: string): string {
  return `https://docs.google.com/document/d/${docId}/export?format=txt`;
}

export function googleDocViewUrl(docId: string): string {
  return `https://docs.google.com/document/d/${docId}/view`;
}

const FIELD_RE = /^\s*(KEYWORDS?|TITLE|LINK|MESSAGE|PROMPT)\s*:\s*(.*)$/i;

export function normaliseKeyword(raw: string): string {
  return raw
    .normalize("NFKC")
    .replace(/^[#"'“”‘’\s]+|[#"'“”‘’\s.!?,;:]+$/g, "")
    .replace(/\s+/g, " ")
    .toUpperCase();
}

export function parsePromptLibrary(rawText: string): PromptLibrary {
  const text = rawText.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  const lines = text.split("\n");
  const aboutLines: string[] = [];
  const entries: LibraryEntry[] = [];
  const warnings: string[] = [];

  type Draft = { keywords: string[]; title?: string; link?: string; messageLines: string[]; inMessage: boolean; line: number };
  let current: Draft | null = null;

  const flush = () => {
    if (!current) return;
    const message = current.messageLines.join("\n").trim();
    const keyword = current.keywords[0];
    if (!keyword) {
      warnings.push(`Line ${current.line}: KEYWORD line has no keyword.`);
    } else if (!message) {
      warnings.push(`Keyword ${keyword}: no MESSAGE text, so it was ignored.`);
    } else {
      entries.push({
        keyword,
        keywords: current.keywords,
        title: current.title?.trim() || keyword,
        link: current.link?.trim() || undefined,
        message,
      });
    }
    current = null;
  };

  lines.forEach((line, i) => {
    const field = line.match(FIELD_RE);
    const name = field?.[1]?.toUpperCase();
    // Inside MESSAGE everything is message text, except a new KEYWORD line which starts the next entry.
    if (current?.inMessage && name !== "KEYWORD" && name !== "KEYWORDS") {
      current.messageLines.push(line);
      return;
    }
    if (!field || !name) {
      if (current) {
        if (line.trim()) warnings.push(`Line ${i + 1}: text before MESSAGE: was ignored ("${line.trim().slice(0, 40)}").`);
      } else {
        aboutLines.push(line);
      }
      return;
    }
    const value = field[2] ?? "";
    if (name === "KEYWORD" || name === "KEYWORDS") {
      flush();
      const keywords = value.split(/[,/|]/).map(normaliseKeyword).filter(Boolean);
      current = { keywords: [...new Set(keywords)], messageLines: [], inMessage: false, line: i + 1 };
      return;
    }
    if (!current) {
      warnings.push(`Line ${i + 1}: ${name}: appears before any KEYWORD: line and was ignored.`);
      return;
    }
    if (name === "TITLE") current.title = value;
    else if (name === "LINK") current.link = value;
    else {
      current.inMessage = true;
      if (value.trim()) current.messageLines.push(value);
    }
  });
  flush();

  const seen = new Map<string, string>();
  for (const entry of entries) {
    for (const kw of entry.keywords) {
      const owner = seen.get(kw);
      if (owner && owner !== entry.keyword) warnings.push(`Keyword ${kw} is used twice; the first entry (${owner}) wins.`);
      else seen.set(kw, entry.keyword);
    }
  }

  return { about: aboutLines.join("\n").trim(), entries, warnings };
}

interface CacheSlot {
  at: number;
  library: PromptLibrary;
}
let cache: CacheSlot | null = null;
const CACHE_MS = 2 * 60 * 1000;

/** Fetch and parse the doc named by COMMENT_BOT_DOC_URL, cached for two minutes. */
export async function loadPromptLibrary(options: { docUrl?: string; fetchImpl?: typeof fetch; force?: boolean } = {}): Promise<PromptLibrary> {
  const docUrl = options.docUrl ?? process.env.COMMENT_BOT_DOC_URL;
  if (!docUrl) {
    return { about: "", entries: [], warnings: ["COMMENT_BOT_DOC_URL is not set, so there are no keyword prompts."] };
  }
  if (!options.force && cache && Date.now() - cache.at < CACHE_MS) return cache.library;
  const docId = extractGoogleDocId(docUrl);
  if (!docId) {
    return { about: "", entries: [], warnings: [`COMMENT_BOT_DOC_URL does not look like a Google Doc link: ${docUrl}`] };
  }
  const doFetch = options.fetchImpl ?? fetch;
  try {
    const response = await doFetch(googleDocExportUrl(docId), { redirect: "follow" });
    const body = await response.text();
    if (!response.ok || /<html/i.test(body.slice(0, 500))) {
      throw new Error(
        `Google returned ${response.status}. Share the doc as "Anyone with the link can view".`,
      );
    }
    const library = parsePromptLibrary(body);
    cache = { at: Date.now(), library };
    return library;
  } catch (error) {
    // Keep serving the last good copy rather than going silent because Google hiccuped.
    if (cache) {
      return { ...cache.library, warnings: [...cache.library.warnings, `Using cached copy: ${(error as Error).message}`] };
    }
    return { about: "", entries: [], warnings: [`Could not load the prompt doc: ${(error as Error).message}`] };
  }
}

export function clearPromptLibraryCache(): void {
  cache = null;
}
