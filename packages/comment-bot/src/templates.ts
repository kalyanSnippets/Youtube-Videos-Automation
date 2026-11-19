/**
 * Wording the comment bot uses, editable on the admin "Reply messages" page.
 * Pure functions only (no database), so the admin page can preview them in the browser.
 *
 * Placeholders:
 *   {name}    the viewer's username, e.g. @ravi
 *   {title}   the resource or video title
 *   {keyword} the keyword they commented, e.g. FABLE
 *   {prompt}  the prompt text itself
 *   {link}    the page on your site where they can copy it
 *   {video}   the YouTube/Instagram link (or a resource's extra link)
 * A line whose {link}, {video} or {keyword} is empty is left out entirely.
 */

export interface ReplyTemplates {
  /** Public replies under an Instagram keyword comment; one is picked at random each time. */
  igPublicReplies: string[];
  /** The Instagram DM with the prompt. */
  igDm: string;
  /** The public YouTube reply for a keyword (YouTube has no DMs). */
  youtubeKeywordReply: string;
  /** How the AI should sound when it answers questions. */
  aiStyle: string;
  /**
   * General comments with no keyword and no question ("nice content!"):
   *  "ai"    the AI writes a short, specific thank-you
   *  "fixed" pick one of generalReplies at random
   *  "off"   don't reply
   */
  generalMode: GeneralMode;
  /** Thank-you lines for generalMode "fixed". */
  generalReplies: string[];
}

export type GeneralMode = "ai" | "fixed" | "off";

export const PLACEHOLDERS: { token: string; meaning: string }[] = [
  { token: "{name}", meaning: "viewer's username, e.g. @ravi" },
  { token: "{title}", meaning: "resource or video title" },
  { token: "{keyword}", meaning: "the word they commented, e.g. FABLE" },
  { token: "{prompt}", meaning: "the prompt text" },
  { token: "{link}", meaning: "page on your site to copy it" },
  { token: "{video}", meaning: "YouTube / Instagram link" },
];

const DEFAULT_TEMPLATES_GENERAL = ["Thank you so much, {name}! 🙌", "Really glad you liked it! 😊", "Thanks {name}! More coming soon 🚀", "Appreciate it, {name} 🙏"];

export const DEFAULT_TEMPLATES: ReplyTemplates = {
  igPublicReplies: [
    "Sent! Check your DMs 📩",
    "Just sent it to your DMs, {name} 🙌",
    "Done! The {title} is in your DMs 📬",
    "Check your inbox, {name}! Sent it over 🚀",
    "It's in your DMs ✅ Enjoy!",
  ],
  igDm: "Hey {name}! Here's the {title} you asked for 👇\n\n{prompt}\n\n📄 Copy it here: {link}\n🔗 {video}",
  youtubeKeywordReply: "Here you go {name} 👇 {title}\n\n{prompt}\n\n📄 Copy it here: {link}\n🔗 {video}",
  aiStyle: "Warm, casual and helpful, like a friendly creator. 1-3 short sentences. At most one emoji.",
  generalMode: "ai",
  generalReplies: DEFAULT_TEMPLATES_GENERAL,
};

export const TEMPLATE_PRESETS: { id: string; label: string; description: string; templates: ReplyTemplates }[] = [
  { id: "friendly", label: "Friendly (default)", description: "Warm and casual, varied replies with emojis.", templates: DEFAULT_TEMPLATES },
  {
    id: "short",
    label: "Short & sweet",
    description: "Minimal wording, link-first. Good for big comment volumes.",
    templates: {
      igPublicReplies: ["Sent 📩", "Check your DMs ✅", "In your inbox, {name} 🙌"],
      igDm: "{title} 👇\n\n{prompt}\n\n{link}",
      youtubeKeywordReply: "{title} 👇\n\n{prompt}\n\n{link}",
      aiStyle: "Very short and friendly. One sentence where possible. No emojis.",
      generalMode: "fixed",
      generalReplies: ["Thanks!", "Thank you, {name}!", "Glad you liked it!"],
    },
  },
  {
    id: "teacher",
    label: "Helpful teacher",
    description: "Explains how to use the prompt. Good for tutorials.",
    templates: {
      igPublicReplies: ["Sent you the {title} 📩 Tip: swap the [brackets] for your own details!", "Check your DMs, {name}. It's all there with tips 👍"],
      igDm: "Hi {name}! Here's the {title} 👇\n\n{prompt}\n\nHow to use it: copy it into ChatGPT, Claude or Gemini and replace anything in [brackets] with your own details.\n\n📄 Easy-copy version: {link}\n▶️ Rewatch the video: {video}",
      youtubeKeywordReply: "Hi {name}! Here's the {title} 👇\n\n{prompt}\n\nTip: replace anything in [brackets] with your own details.\n📄 Easy-copy version: {link}",
      aiStyle: "Patient and clear, like a teacher. Explain briefly in 2-3 sentences. Use simple words. At most one emoji.",
      generalMode: "ai",
      generalReplies: DEFAULT_TEMPLATES_GENERAL,
    },
  },
  {
    id: "hype",
    label: "High energy",
    description: "Excited, emoji-rich creator voice.",
    templates: {
      igPublicReplies: ["🚀 Sent! Go check your DMs!", "Boom 💥 it's in your DMs, {name}!", "Done ✅🔥 Enjoy the {title}!"],
      igDm: "Yooo {name} 🔥 here's the {title}!\n\n{prompt}\n\n📄 Copy it here: {link}\n🎬 {video}",
      youtubeKeywordReply: "🔥 {name}, here's the {title}!\n\n{prompt}\n\n📄 {link}",
      aiStyle: "Energetic and upbeat, 1-2 short sentences, 1-2 emojis.",
      generalMode: "fixed",
      generalReplies: ["🔥🔥 Thanks {name}!", "Let's gooo 🚀 Thanks for watching!", "You're awesome, {name} 🙌"],
    },
  },
];

const MAX_TEMPLATE = 2000;

function cleanString(v: unknown, fallback: string): string {
  return typeof v === "string" && v.trim() ? v.replace(/\r\n?/g, "\n").slice(0, MAX_TEMPLATE) : fallback;
}

/** Accepts whatever is stored (or posted from the form) and returns a complete, safe template set. */
export function normaliseTemplates(raw: unknown): ReplyTemplates {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<Record<keyof ReplyTemplates, unknown>>;
  const lines = (v: unknown) =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").map((x) => x.trim()).filter(Boolean).slice(0, 20).map((x) => x.slice(0, 300)) : [];
  const replies = lines(r.igPublicReplies);
  const general = lines(r.generalReplies);
  const mode = r.generalMode === "fixed" || r.generalMode === "off" ? r.generalMode : "ai";
  return {
    igPublicReplies: replies.length ? replies : DEFAULT_TEMPLATES.igPublicReplies,
    igDm: cleanString(r.igDm, DEFAULT_TEMPLATES.igDm),
    youtubeKeywordReply: cleanString(r.youtubeKeywordReply, DEFAULT_TEMPLATES.youtubeKeywordReply),
    aiStyle: cleanString(r.aiStyle, DEFAULT_TEMPLATES.aiStyle).slice(0, 500),
    generalMode: mode,
    generalReplies: general.length ? general : DEFAULT_TEMPLATES.generalReplies,
  };
}

export interface TemplateVars {
  name?: string;
  title: string;
  keyword?: string;
  prompt?: string;
  link?: string;
  video?: string;
}

/** Fills placeholders. Lines that depend on a missing link/video/keyword are dropped. */
export function fillTemplate(template: string, vars: TemplateVars): string {
  const values: Record<string, string> = {
    name: vars.name ? (vars.name.startsWith("@") ? vars.name : `@${vars.name}`) : "friend",
    title: vars.title,
    keyword: vars.keyword ?? "",
    prompt: vars.prompt ?? "",
    link: vars.link ?? "",
    video: vars.video && vars.video !== vars.link ? vars.video : "",
  };
  const optional = ["link", "video", "keyword"];
  return template
    .split("\n")
    .filter((line) => !optional.some((k) => line.includes(`{${k}}`) && !values[k]))
    .join("\n")
    .replace(/\{(name|title|keyword|prompt|link|video)\}/g, (_, k: string) => values[k] ?? "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

/**
 * Fills a delivery template within a character limit. If the prompt makes it too long, the prompt is
 * cut short and the reader is pointed at the full version on the site.
 */
export function renderDelivery(template: string, vars: TemplateVars, limit: number): string {
  const full = fillTemplate(template, vars);
  if (full.length <= limit) return full;
  const marker = "\u0000PROMPT\u0000";
  const shell = fillTemplate(template, { ...vars, prompt: marker });
  const fullLink = vars.link || vars.video;
  const extra = fullLink && !shell.includes(fullLink) ? `\n\n📄 Full prompt here 👉 ${fullLink}` : "";
  const room = limit - (shell.length - marker.length) - extra.length - 1;
  const cut = `${(vars.prompt ?? "").slice(0, Math.max(0, room)).trimEnd()}…`;
  const out = `${shell.replace(marker, cut)}${extra}`;
  return out.length <= limit ? out : `${out.slice(0, limit - 1)}…`;
}
