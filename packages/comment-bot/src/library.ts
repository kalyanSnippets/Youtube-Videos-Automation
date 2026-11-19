import { and, asc, eq, isNotNull } from "drizzle-orm";
import { db, schema } from "@yaos/database";
import type { LibraryEntry, PromptLibrary } from "./types";

/** Public base URL of the site (Netlify sets URL on every deploy). */
export function siteBaseUrl(): string | undefined {
  return (process.env.SITE_URL ?? process.env.URL)?.replace(/\/$/, "");
}

export function resourceUrl(slug: string, base = siteBaseUrl()): string | undefined {
  return base ? `${base}/r/${slug}` : undefined;
}

export function videoPageUrl(slug: string, base = siteBaseUrl()): string | undefined {
  return base ? `${base}/v/${slug}` : undefined;
}

type VideoRow = typeof schema.videos.$inferSelect;

/** Videos that have both a keyword and a prompt become keyword entries. The bot links to the video's page on the site. */
export function videosToEntries(rows: VideoRow[], base = siteBaseUrl()): LibraryEntry[] {
  return rows
    .filter((v) => !v.hidden && v.keyword && v.prompt)
    .map((v) => ({
      keyword: v.keyword!,
      keywords: [v.keyword!],
      title: v.title,
      link: v.watchUrl,
      message: v.prompt!,
      url: videoPageUrl(v.slug, base),
    }));
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
      link: row.link ?? undefined,
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
  const [rows, settings, videoRows] = await Promise.all([
    db.select().from(schema.resources).where(eq(schema.resources.published, true)).orderBy(asc(schema.resources.sortOrder), asc(schema.resources.createdAt)),
    db.select().from(schema.siteSettings).where(eq(schema.siteSettings.id, 1)),
    db
      .select()
      .from(schema.videos)
      .where(and(eq(schema.videos.hidden, false), isNotNull(schema.videos.keyword), isNotNull(schema.videos.prompt)))
      .catch(() => [] as VideoRow[]), // table not migrated yet: keep working with resources only
  ]);
  const base = siteBaseUrl();
  const resourceLib = toLibrary(rows, settings[0]?.about ?? "", base);
  const seen = new Set(resourceLib.entries.flatMap((e) => e.keywords));
  const extra = videosToEntries(videoRows, base).filter((e) => {
    if (seen.has(e.keyword)) {
      resourceLib.warnings.push(`Keyword ${e.keyword} is on a video and a resource; the resource wins.`);
      return false;
    }
    seen.add(e.keyword);
    return true;
  });
  const entries = [...resourceLib.entries, ...extra];
  const warnings = resourceLib.warnings.filter((w) => !w.startsWith("No published resources"));
  if (!entries.length) warnings.push("No keywords yet: upload a prompt to a video, or add a resource.");
  const library = { about: resourceLib.about, entries, warnings };
  cache = { at: Date.now(), library };
  return library;
}

export function clearPromptLibraryCache(): void {
  cache = null;
}
