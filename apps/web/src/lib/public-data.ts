import { revalidateTag, unstable_cache } from "next/cache";
import { and, desc, eq } from "drizzle-orm";
import { db, ensureSchemaPatches, schema } from "@yaos/database";
import { resolveContentKind, type ContentKind } from "@yaos/comment-bot";
import { DEFAULT_SETTINGS, getFollowLinks, getSiteSettings, listResources, type FollowLinks } from "@/lib/site";

/**
 * Everything the public website shows, cached so a visit doesn't wait on the database (which is
 * on the other side of the world from the servers that build the pages). The cache is cleared the
 * moment anything changes in the admin (refreshPublicSite) and otherwise refreshed every 10 minutes.
 */
export const PUBLIC_TAG = "public-site";
const REVALIDATE = 600;

export function refreshPublicSite(): void {
  revalidateTag(PUBLIC_TAG);
}

export interface PublicSettings {
  siteName: string;
  tagline: string;
  youtubeUrl: string | null;
  instagramUrl: string | null;
  newsletterEnabled: boolean;
  follow: FollowLinks;
}

export const getPublicSettings = unstable_cache(
  async (): Promise<PublicSettings> => {
    const s = await getSiteSettings().catch(() => DEFAULT_SETTINGS);
    const follow = await getFollowLinks(s).catch(() => ({ youtube: null, instagram: null }));
    return { siteName: s.siteName, tagline: s.tagline, youtubeUrl: s.youtubeUrl, instagramUrl: s.instagramUrl, newsletterEnabled: s.newsletterEnabled, follow };
  },
  ["public-settings-v1"],
  { tags: [PUBLIC_TAG], revalidate: REVALIDATE },
);

/** "Title #shorts #ai" -> "Title": hashtags read badly as page titles. */
export function displayTitle(title: string): string {
  return title.replace(/(^|\s)#[\p{L}\p{N}_]+/gu, " ").replace(/\s{2,}/g, " ").trim() || title;
}

/** Thumbnails straight from YouTube's image servers (fast, cached worldwide); Instagram's expire, so they go through our proxy. */
export function thumbSrc(v: { id: string; platform: string; externalId: string; thumbnailUrl: string | null }): string {
  if (v.platform === "YOUTUBE") {
    return v.thumbnailUrl?.startsWith("https://i.ytimg.com/") ? v.thumbnailUrl : `https://i.ytimg.com/vi/${v.externalId}/hqdefault.jpg`;
  }
  return `/api/thumb/${v.id}`;
}

export interface PublicVideoCard {
  id: string;
  platform: string;
  format: string | null;
  slug: string;
  title: string;
  description: string | null;
  thumb: string;
  publishedAt: string | null;
  durationSeconds: number | null;
  views: number | null;
  keyword: string | null;
  kind: ContentKind;
  hasContent: boolean;
}

export const getPublicVideos = unstable_cache(
  async (): Promise<PublicVideoCard[]> => {
    await ensureSchemaPatches();
    const rows = await db.select().from(schema.videos).where(eq(schema.videos.hidden, false)).orderBy(desc(schema.videos.publishedAt)).catch(() => []);
    return rows.map((v) => ({
      id: v.id,
      platform: v.platform,
      format: v.format,
      slug: v.slug,
      title: displayTitle(v.title),
      description: v.description?.slice(0, 600) ?? null,
      thumb: thumbSrc(v),
      publishedAt: v.publishedAt?.toISOString() ?? null,
      durationSeconds: v.durationSeconds,
      views: v.views,
      keyword: v.keyword,
      kind: resolveContentKind(v),
      hasContent: Boolean(v.prompt?.trim() || v.attachmentName),
    }));
  },
  ["public-videos-v1"],
  { tags: [PUBLIC_TAG], revalidate: REVALIDATE },
);

export interface PublicVideo extends PublicVideoCard {
  fullDescription: string | null;
  watchUrl: string;
  prompt: string | null;
  resourceTitle: string | null;
  extraLink: string | null;
  attachment: { name: string; type: string | null; size: number | null } | null;
}

export const getPublicVideo = unstable_cache(
  async (slug: string): Promise<PublicVideo | null> => {
    await ensureSchemaPatches();
    const [v] = await db.select().from(schema.videos).where(and(eq(schema.videos.slug, slug), eq(schema.videos.hidden, false)));
    if (!v) return null;
    return {
      id: v.id,
      platform: v.platform,
      format: v.format,
      slug: v.slug,
      title: displayTitle(v.title),
      description: v.description?.slice(0, 600) ?? null,
      fullDescription: v.description,
      thumb: thumbSrc(v),
      publishedAt: v.publishedAt?.toISOString() ?? null,
      durationSeconds: v.durationSeconds,
      views: v.views,
      keyword: v.keyword,
      kind: resolveContentKind(v),
      hasContent: Boolean(v.prompt?.trim() || v.attachmentName),
      watchUrl: v.watchUrl,
      prompt: v.prompt,
      resourceTitle: v.resourceTitle,
      extraLink: v.extraLink,
      attachment: v.attachmentName ? { name: v.attachmentName, type: v.attachmentType, size: v.attachmentSize } : null,
    };
  },
  ["public-video-v1"],
  { tags: [PUBLIC_TAG], revalidate: REVALIDATE },
);

export const getPublicResources = unstable_cache(
  async () => (await listResources({ publishedOnly: true }).catch(() => [])).map((r) => ({ slug: r.slug, title: r.title, summary: r.summary, keywords: r.keywords ?? [] })),
  ["public-resources-v1"],
  { tags: [PUBLIC_TAG], revalidate: REVALIDATE },
);

/**
 * Formatted HTML of a video's uploaded Word / Markdown / text document, made the first time it's
 * viewed and stored, then cached. PDFs return null: the page draws them with PDF.js instead.
 */
export const getAttachmentHtml = unstable_cache(
  async (videoId: string): Promise<string | null> => {
    const [video] = await db.select({ name: schema.videos.attachmentName }).from(schema.videos).where(eq(schema.videos.id, videoId));
    const name = video?.name?.toLowerCase() ?? "";
    if (!name || name.endsWith(".pdf")) return null;
    const [stored] = await db.select({ html: schema.videoAttachments.html }).from(schema.videoAttachments).where(eq(schema.videoAttachments.videoId, videoId));
    if (stored?.html) return stored.html;
    const [file] = await db.select({ data: schema.videoAttachments.data }).from(schema.videoAttachments).where(eq(schema.videoAttachments.videoId, videoId));
    if (!file) return null;
    const { docxToHtml, markdownToHtml } = await import("@/lib/document-html");
    const bytes = Buffer.from(file.data, "base64");
    const html = name.endsWith(".docx") ? await docxToHtml(bytes) : markdownToHtml(bytes.toString("utf8"));
    await db.update(schema.videoAttachments).set({ html }).where(eq(schema.videoAttachments.videoId, videoId)).catch(() => undefined);
    return html;
  },
  ["attachment-html-v1"],
  { tags: [PUBLIC_TAG], revalidate: 86_400 },
);

/** A pasted resource (not a prompt) laid out as a formatted document. */
export const getTextResourceHtml = unstable_cache(
  async (_videoId: string, text: string): Promise<string> => {
    const { markdownToHtml } = await import("@/lib/document-html");
    return markdownToHtml(text);
  },
  ["text-resource-html-v1"],
  { tags: [PUBLIC_TAG], revalidate: 86_400 },
);
