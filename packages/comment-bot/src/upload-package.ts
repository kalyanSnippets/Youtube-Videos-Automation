import { splitKeywords } from "./matcher";

/**
 * Reads an "upload package" (the Markdown Claude writes for each batch of videos) and pulls out,
 * for every video, what the comment bot needs: the keyword viewers comment, the prompt to send
 * them, and the titles used to recognise the video once it's posted.
 *
 * Two layouts are understood:
 * 1. The explicit block (best; see PACKAGE_INSTRUCTIONS):
 *      **Comment keyword:** EDIT
 *      **Prompt name:** AI video-review prompt
 *      **Prompt to send:**
 *      ```
 *      ...
 *      ```
 * 2. The free-form layout of older packages: `Comment "EDIT" and I'll DM you my ... prompt` in the
 *    caption, and the prompt in a code block under a "The prompt you promised" style heading.
 */

export interface PlannedPost {
  /** The section heading, e.g. "Reel 4: GPT-6.1 Terra". */
  label: string;
  youtubeTitle: string | null;
  instagramCaption: string | null;
  /** Comma-separated, upper-cased. */
  keywords: string[];
  promptName: string | null;
  prompt: string | null;
  extraLink: string | null;
}

export interface ParsedPackage {
  posts: PlannedPost[];
  /** Sections that look like a video but that the bot can't use, with the reason. */
  skipped: { label: string; reason: string }[];
}

/** What to tell Claude so every future package imports exactly. Shown (copyable) in the admin. */
export const PACKAGE_INSTRUCTIONS = `In every upload package, give each video its own "## " section. In each section include the YouTube title line and the Instagram caption as you do now. For every video that asks viewers to comment a word to get something, also add exactly this block:

**Comment keyword:** WORD (several? separate with commas)
**Prompt name:** a short name for what they get
**Prompt to send:**
\`\`\`
the full prompt or resource text
\`\`\`
**Link:** https://... (optional extra link)

Don't suggest ManyChat or replying by hand: my AI with Kalyan OS app reads this block and sends it automatically.`;

interface CodeBlock {
  start: number;
  end: number;
  text: string;
}

function codeBlocks(text: string): CodeBlock[] {
  const out: CodeBlock[] = [];
  const re = /```[^\n]*\n([\s\S]*?)```/g;
  for (let m = re.exec(text); m; m = re.exec(text)) out.push({ start: m.index, end: m.index + m[0].length, text: m[1]!.replace(/\s+$/, "") });
  return out;
}

/** The first code block that starts after `index` (within `maxGap` characters). */
function blockAfter(blocks: CodeBlock[], index: number, maxGap = 400): CodeBlock | null {
  return blocks.find((b) => b.start >= index && b.start - index <= maxGap) ?? null;
}

/** Text after a "**Label:**" line: inline code, or the rest of the line. */
function fieldValue(section: string, label: RegExp): { value: string | null; index: number } {
  // [ \\t] rather than \\s after the label, so an empty value doesn't swallow the next line.
  const re = new RegExp(`^[ \\t>*-]*\\*\\*[ \\t]*(?:${label.source})[ \\t]*:?[ \\t]*\\*\\*[ \\t]*:?[ \\t]*(.*)$`, "im");
  const m = re.exec(section);
  if (!m) return { value: null, index: -1 };
  const raw = m[1]!.trim();
  const inline = raw.match(/^`([^`]+)`/)?.[1] ?? raw;
  return { value: inline.trim() || null, index: m.index + m[0].length };
}

function clean(text: string | null | undefined): string | null {
  const t = text?.replace(/\r/g, "").trim();
  return t ? t : null;
}

/** Words viewers are told to comment: Comment "EDIT", comment EDIT, comment 'GAME'. */
export function keywordsFromCalls(text: string): string[] {
  const found = new Set<string>();
  // Quoted, any case: Comment "edit". Unquoted, the word itself in capitals: comment GAME.
  const quoted = /\bcomment(?:s|ing)?\s+(?:the\s+word\s+)?["“'‘`]([A-Za-z0-9][A-Za-z0-9_-]{1,29})["”'’`]/gi;
  const bare = /\b[Cc]omment\s+([A-Z0-9][A-Z0-9_-]{1,29})\b/g;
  for (const re of [quoted, bare]) {
    for (let m = re.exec(text); m; m = re.exec(text)) found.add(m[1]!.toUpperCase());
  }
  return [...found];
}

/** "I'll DM you my AI video-review prompt." -> "AI video-review prompt" */
function promptNameFromCall(text: string): string | null {
  const m = text.match(/\b(?:DM|send)\s+you\s+(?:my\s+|the\s+)?([^.!\n🎬📩👇]{3,80}?)(?:[.!\n]|\s+[🎬📩👇]|$)/i);
  return clean(m?.[1]?.replace(/["“”]/g, ""));
}

function splitSections(markdown: string): { label: string; body: string }[] {
  // Packages put one video per "## " section. Fall back to "# " / "### " if there are none.
  for (const level of ["##", "#", "###"]) {
    const re = new RegExp(`^${level}\\s+(.+)$`, "gm");
    const heads = [...markdown.matchAll(re)];
    if (heads.length < 1) continue;
    const sections = heads.map((h, i) => ({
      label: h[1]!.trim(),
      body: markdown.slice(h.index! + h[0].length, i + 1 < heads.length ? heads[i + 1]!.index : undefined),
    }));
    if (sections.some((s) => /youtube title|instagram caption|comment keyword/i.test(s.body))) return sections;
  }
  return [{ label: "Package", body: markdown }];
}

export function parseUploadPackage(markdown: string): ParsedPackage {
  const text = markdown.replace(/\r\n?/g, "\n");
  const posts: PlannedPost[] = [];
  const skipped: ParsedPackage["skipped"] = [];

  for (const { label, body } of splitSections(text)) {
    const isVideo = /youtube title|instagram caption|comment keyword|prompt to send/i.test(body);
    if (!isVideo) continue;
    const blocks = codeBlocks(body);

    const yt = fieldValue(body, /youtube\s+title/);
    const youtubeTitle = clean(yt.value ?? (yt.index >= 0 ? blockAfter(blocks, yt.index)?.text : null));
    const igHead = body.search(/instagram caption/i);
    const instagramCaption = clean(igHead >= 0 ? blockAfter(blocks, igHead)?.text : null);

    // Explicit block first.
    const kw = fieldValue(body, /comment\s+keywords?|keywords?/);
    let keywords = kw.value ? splitKeywords(kw.value.replace(/`/g, "")) : [];
    const nameField = fieldValue(body, /prompt\s+name/);
    let promptName = clean(nameField.value);
    const promptField = fieldValue(body, /prompt\s+to\s+send/);
    let prompt = clean(promptField.value && !/^```/.test(promptField.value) ? promptField.value : null);
    if (promptField.index >= 0 && !prompt) prompt = clean(blockAfter(blocks, promptField.index)?.text);
    const link = fieldValue(body, /link|extra\s+link/);
    const extraLink = link.value && /^https?:\/\//i.test(link.value) ? link.value.split(/\s/)[0]! : null;

    // Older free-form packages.
    if (!prompt) {
      const promised = body.search(/^#{2,4}.*\bprompts?\b.*$|send (?:this|these|it|them) to everyone|the prompts? you promised/im);
      if (promised >= 0) prompt = clean(blockAfter(blocks, promised, 300)?.text);
    }
    if (!keywords.length) {
      // Only the calls to action in the captions and pinned comment, not "drives X comments" notes.
      const calls = [instagramCaption ?? "", youtubeTitle ?? "", ...blocks.map((b) => b.text), body.match(/\*\*Pinned comment:\*\*.*$/im)?.[0] ?? ""].join("\n");
      keywords = keywordsFromCalls(calls);
    }
    if (!promptName) promptName = promptNameFromCall([instagramCaption ?? "", body].join("\n"));

    if (!keywords.length && !prompt) continue; // a video with nothing for the bot to send
    if (!keywords.length) {
      skipped.push({ label, reason: "Has a prompt but no comment keyword" });
      continue;
    }
    if (!prompt) {
      skipped.push({ label, reason: `Asks for ${keywords.join(", ")} comments, but there's no prompt to send (probably a poll or question)` });
      continue;
    }
    posts.push({ label, youtubeTitle, instagramCaption, keywords, promptName, prompt, extraLink });
  }
  return { posts, skipped };
}

// ------------------------------------------------------------------ matching to real videos

export interface MatchCandidate {
  id: string;
  platform: string;
  title: string;
  description: string | null;
}

function words(text: string): Set<string> {
  return new Set(
    text
      .replace(/(^|\s)#[\p{L}\p{N}_]+/gu, " ")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2),
  );
}

function overlap(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  const shared = [...a].filter((w) => b.has(w)).length;
  return shared / Math.min(a.size, b.size);
}

/**
 * How well a planned post fits a real video, 0..1. YouTube videos are compared with the package's
 * YouTube title; Instagram posts with the opening of the caption (Instagram has no titles).
 */
export function matchScore(post: Pick<PlannedPost, "youtubeTitle" | "instagramCaption" | "label">, video: MatchCandidate): number {
  const videoText = words(`${video.title} ${(video.description ?? "").slice(0, 300)}`);
  if (video.platform === "YOUTUBE") {
    const title = post.youtubeTitle ? words(post.youtubeTitle) : null;
    const exact = post.youtubeTitle && video.title.trim().toLowerCase() === post.youtubeTitle.trim().toLowerCase();
    if (exact) return 1;
    return Math.max(title ? overlap(title, words(video.title)) : 0, overlap(words(post.label), words(video.title)) * 0.8);
  }
  const caption = post.instagramCaption ? words(post.instagramCaption.slice(0, 300)) : null;
  return caption ? overlap(caption, videoText) : overlap(words(post.label), videoText) * 0.8;
}

export const MATCH_THRESHOLD = 0.6;

/** The best video per platform for this post, if it clears the threshold. */
export function bestMatches<T extends MatchCandidate>(post: PlannedPost, videos: T[]): T[] {
  const out: T[] = [];
  for (const platform of ["YOUTUBE", "INSTAGRAM"]) {
    let best: { v: T; s: number } | null = null;
    for (const v of videos.filter((x) => x.platform === platform)) {
      const s = matchScore(post, v);
      if (!best || s > best.s) best = { v, s };
    }
    if (best && best.s >= MATCH_THRESHOLD) out.push(best.v);
  }
  return out;
}
