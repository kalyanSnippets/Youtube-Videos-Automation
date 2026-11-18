import { asc, eq } from "drizzle-orm";
import { db, schema } from "@yaos/database";

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
  updatedAt: new Date(0),
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const [row] = await db.select().from(schema.siteSettings).where(eq(schema.siteSettings.id, 1));
  return row ?? DEFAULT_SETTINGS;
}

export async function listResources(opts: { publishedOnly?: boolean } = {}): Promise<Resource[]> {
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
