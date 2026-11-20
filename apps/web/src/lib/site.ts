import { asc, eq } from "drizzle-orm";
import { db, ensureSchemaPatches, schema } from "@yaos/database";

export type SiteSettings = typeof schema.siteSettings.$inferSelect;
export type Resource = typeof schema.resources.$inferSelect;

export const DEFAULT_SETTINGS: SiteSettings = {
  id: 1,
  siteName: "AI with Kalyan",
  tagline: "Free AI prompts and templates from my videos. Copy, paste, create.",
  about: "",
  youtubeUrl: null,
  instagramUrl: null,
  newsletterEnabled: true,
  botTemplates: null,
  logoData: null,
  updatedAt: new Date(0),
};

export async function getSiteSettings(): Promise<SiteSettings> {
  await ensureSchemaPatches();
  const [row] = await db.select().from(schema.siteSettings).where(eq(schema.siteSettings.id, 1));
  return row ?? DEFAULT_SETTINGS;
}

export async function listResources(opts: { publishedOnly?: boolean } = {}): Promise<Resource[]> {
  await ensureSchemaPatches();
  const q = db.select().from(schema.resources);
  const rows = opts.publishedOnly ? await q.where(eq(schema.resources.published, true)).orderBy(asc(schema.resources.sortOrder), asc(schema.resources.createdAt)) : await q.orderBy(asc(schema.resources.sortOrder), asc(schema.resources.createdAt));
  return rows;
}

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/[\s_]+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 80) || "resource"
  );
}

export interface FollowLinks {
  /** Opens YouTube's own "Subscribe to …?" confirmation. */
  youtube: string | null;
  /** Opens the Instagram profile (the app, on phones). */
  instagram: string | null;
}

function withSubConfirmation(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set("sub_confirmation", "1");
    return u.toString();
  } catch {
    return url;
  }
}

/** Subscribe/follow links: the connected accounts first (exact channel id / username), then Site settings. */
export async function getFollowLinks(settings: SiteSettings): Promise<FollowLinks> {
  const conns = await db.select().from(schema.socialConnections).catch(() => []);
  const yt = conns.find((c) => c.platform === "YOUTUBE");
  const ig = conns.find((c) => c.platform === "INSTAGRAM");
  const igUser = ig?.accountName?.replace(/^@/, "");
  return {
    youtube: yt ? `https://www.youtube.com/channel/${yt.accountId}?sub_confirmation=1` : settings.youtubeUrl ? withSubConfirmation(settings.youtubeUrl) : null,
    instagram: settings.instagramUrl ?? (igUser ? `https://www.instagram.com/${igUser}/` : null),
  };
}
