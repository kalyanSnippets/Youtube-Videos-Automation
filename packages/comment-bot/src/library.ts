import { and, asc, eq, isNotNull } from "drizzle-orm";
import { db, ensureSchemaPatches, schema } from "@yaos/database";
import { normaliseTemplates } from "./templates";
import { splitKeywords } from "./matcher";
import type { LibraryEntry, PromptLibrary } from "./types";
import { resolveContentKind } from "./content-kind";

/** Public base URL of the site (Netlify sets URL on every deploy). */
export function siteBaseUrl(): string | undefined {
  return (process.env.SITE_URL ?? process.env.URL)?.replace(/\/$/, "");
}

export function resourceUrl(slug: string, base = siteBaseUrl()): string | undefined {
  return base ? `${base}/r/${slug}` : undefined;
}

export function videoFileUrl(slug: string, base = siteBaseUrl()): string | undefined {
  return base ? `${base}/v/${slug}/file` : undefined;
}

export function videoPageUrl(slug: string, base = siteBaseUrl()): string | undefined {
  return base ? `${base}/v/${slug}` : undefined;
}

type VideoRow = typeof schema.videos.$inferSelect;

/** "My video #shorts #ai" -> "My video" (hashtags read badly inside a DM). */
export function cleanVideoTitle(title: string): string {
  return title.replace(/(^|\s)#[\p{L}\p{N}_]+/gu, " ").replace(/\s{2,}/g, " ").trim() || title;
}

/** Videos that have both a keyword and a prompt become keyword entries. The bot links to the video's page on the site. */
export function videosToEntries(rows: VideoRow[], base = siteBaseUrl()): LibraryEntry[] {
  return rows
    // A keyword counts as soon as it's set, even before the prompt is added (then it's "coming soon").
    .filter((v) => !v.hidden && splitKeywords(v.keyword).length > 0)
    .map((v) => ({
      keyword: splitKeywords(v.keyword)[0] ?? v.keyword!,
      keywords: splitKeywords(v.keyword),
      title: v.resourceTitle?.trim() || cleanVideoTitle(v.title),
      link: v.watchUrl,
      message: v.prompt ?? "",
      url: videoPageUrl(v.slug, base),
      mediaIds: [v.externalId],
      kind: resolveContentKind(v),
      ...(fileOf(v, base) ? { file: fileOf(v, base) } : {}),
      ...(v.prompt || v.attachmentName ? {} : { comingSoon: true }),
    }));
}

function fileOf(v: VideoRow, base: string | undefined): { name: string; url: string } | undefined {
  const url = v.attachmentName ? videoFileUrl(v.slug, base) : undefined;
  return url ? { name: v.attachmentName!, url } : undefined;
}

type ResourceRow = typeof schema.resources.$inferSelect;

export function toLibrary(rows: ResourceRow[], about: string, base = siteBaseUrl()): PromptLibrary {
  const warnings: string[] = [];
  const seen = new Map<string, string>();
  const entries: LibraryEntry[] = [];
  for (const row of rows) {
    if (!row.published) continue;
    const keywords = (row.keywords ?? []).filter((kw) => {
      const owner = seen.get(kw);
      if (owner) {
        warnings.push(`Keyword ${kw} is on both "${owner}" and "${row.title}"; the first one wins.`);
        return false;
      }
      seen.set(kw, row.title);
      return true;
    });
    if (!keywords.length) continue;
    entries.push({
      keyword: keywords[0]!,
      keywords,
      title: row.title,
      link: row.link ?? row.videoUrl ?? row.instagramUrl ?? undefined,
      message: row.body,
      url: resourceUrl(row.slug, base),
    });
  }
  if (!entries.length) warnings.push("No published resources with keywords yet. Add one on the Resources page.");
  if (!about.trim()) warnings.push("Your \"About me\" notes are empty; the AI answers better with them (Resources → Site settings).");
  return { about, entries, warnings };
}

let cache: { at: number; library: PromptLibrary } | null = null;
const CACHE_MS = 30 * 1000;

/** Published resources + About notes, cached briefly so a burst of comments doesn't re-query. */
export async function loadPromptLibrary(options: { force?: boolean } = {}): Promise<PromptLibrary> {
  if (!options.force && cache && Date.now() - cache.at < CACHE_MS) return cache.library;
  await ensureSchemaPatches();
  const [rows, settings, videoRows, enabledRows] = await Promise.all([
    db.select().from(schema.resources).where(eq(schema.resources.published, true)).orderBy(asc(schema.resources.sortOrder), asc(schema.resources.createdAt)),
    db.select().from(schema.siteSettings).where(eq(schema.siteSettings.id, 1)),
    db
      .select()
      .from(schema.videos)
      .where(and(eq(schema.videos.hidden, false), isNotNull(schema.videos.keyword)))
      .catch(() => [] as VideoRow[]), // table not migrated yet: keep working with resources only
    db
      .select({ id: schema.videos.externalId })
      .from(schema.videos)
      .where(and(eq(schema.videos.botEnabled, true), eq(schema.videos.hidden, false)))
      .catch(() => null), // column missing: don't block every reply
  ]);
  const base = siteBaseUrl();
  const resourceLib = toLibrary(rows, settings[0]?.about ?? "", base);
  // Every video keeps its own entry, even when keywords repeat (the Short and the Reel of the same
  // content): the bot picks the one the comment is on. Old standalone resources come after videos.
  const extra = videosToEntries(videoRows, base);
  const entries = [...extra, ...resourceLib.entries];
  const warnings = resourceLib.warnings.filter((w) => !w.startsWith("No published resources"));
  if (!entries.length) warnings.push("No keywords yet: upload a prompt to a video, or add a resource.");
  const library: PromptLibrary = {
    about: resourceLib.about,
    entries,
    warnings,
    templates: normaliseTemplates(settings[0]?.botTemplates),
    siteUrl: base,
    enabledMediaIds: enabledRows ? new Set(enabledRows.map((r) => r.id)) : undefined,
  };
  cache = { at: Date.now(), library };
  return library;
}

export function clearPromptLibraryCache(): void {
  cache = null;
}
