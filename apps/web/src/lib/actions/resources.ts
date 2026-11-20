"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, ensureSchemaPatches, schema } from "@yaos/database";
import { clearPromptLibraryCache, normaliseKeyword } from "@yaos/comment-bot";
import { requireAdmin } from "@/lib/admin";
import { slugify } from "@/lib/site";

export interface FormState {
  error?: string;
  saved?: boolean;
}

function str(form: FormData, key: string): string {
  return String(form.get(key) ?? "").trim();
}

function optionalUrl(value: string, field: string): string | null {
  if (!value) return null;
  try {
    const u = new URL(value);
    if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error();
    return u.toString();
  } catch {
    throw new Error(`${field} must be a full link starting with https://`);
  }
}

function refresh() {
  clearPromptLibraryCache();
  revalidatePath("/", "layout");
}

export async function saveResource(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  await ensureSchemaPatches();
  const id = str(form, "id");
  try {
    const title = str(form, "title");
    const body = String(form.get("body") ?? "").trim();
    if (!title) return { error: "Give it a title." };
    if (!body) return { error: "Add the prompt / resource text." };
    const slug = slugify(str(form, "slug") || title);
    const keywords = [...new Set(str(form, "keywords").split(/[,\n]/).map(normaliseKeyword).filter(Boolean))];

    // Keywords must be unique across resources, or the bot wouldn't know which one to send.
    const others = await db.select({ title: schema.resources.title, keywords: schema.resources.keywords }).from(schema.resources).where(id ? ne(schema.resources.id, id) : undefined);
    for (const kw of keywords) {
      const clash = others.find((o) => (o.keywords ?? []).includes(kw));
      if (clash) return { error: `Keyword ${kw} is already used by "${clash.title}".` };
    }
    // A video may use the same keyword only if it's the video this resource is about.
    const linked = new Set([str(form, "videoUrl"), str(form, "instagramUrl")].filter(Boolean));
    const videos = await db
      .select({ title: schema.videos.title, keyword: schema.videos.keyword, watchUrl: schema.videos.watchUrl })
      .from(schema.videos)
      .catch(() => [] as { title: string; keyword: string | null; watchUrl: string }[]);
    for (const kw of keywords) {
      const clash = videos.find((v) => v.keyword === kw && !linked.has(v.watchUrl));
      if (clash) return { error: `Keyword ${kw} is already used by the video "${clash.title}". Link that video here, or pick another keyword.` };
    }
    const slugClash = await db.select({ id: schema.resources.id }).from(schema.resources).where(id ? and(eq(schema.resources.slug, slug), ne(schema.resources.id, id)) : eq(schema.resources.slug, slug));
    if (slugClash.length) return { error: `The page address /r/${slug} is taken. Change the page address.` };

    const values = {
      title,
      slug,
      keywords,
      summary: str(form, "summary") || null,
      body,
      link: optionalUrl(str(form, "link"), "Extra link"),
      videoUrl: optionalUrl(str(form, "videoUrl"), "YouTube link"),
      instagramUrl: optionalUrl(str(form, "instagramUrl"), "Instagram link"),
      published: form.get("published") === "on",
      sortOrder: Number(str(form, "sortOrder")) || 0,
      updatedAt: new Date(),
    };
    if (id) await db.update(schema.resources).set(values).where(eq(schema.resources.id, id));
    else await db.insert(schema.resources).values(values);
  } catch (error) {
    return { error: (error as Error).message };
  }
  refresh();
  redirect("/resources?saved=1");
}

export async function deleteResource(form: FormData): Promise<void> {
  await requireAdmin();
  const id = str(form, "id");
  if (id) await db.delete(schema.resources).where(eq(schema.resources.id, id));
  refresh();
  redirect("/resources");
}

export async function saveSiteSettings(_prev: FormState, form: FormData): Promise<FormState> {
  try {
    await requireAdmin();
    const values = {
      siteName: str(form, "siteName") || "AI with Kalyan",
      tagline: str(form, "tagline"),
      about: String(form.get("about") ?? "").trim(),
      youtubeUrl: optionalUrl(str(form, "youtubeUrl"), "YouTube link"),
      instagramUrl: optionalUrl(str(form, "instagramUrl"), "Instagram link"),
      newsletterEnabled: form.get("newsletterEnabled") === "on",
      updatedAt: new Date(),
    };
    await db.insert(schema.siteSettings).values({ id: 1, ...values }).onConflictDoUpdate({ target: schema.siteSettings.id, set: values });
  } catch (error) {
    return { error: (error as Error).message };
  }
  refresh();
  return { saved: true };
}

const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/gif"];
const MAX_LOGO_BYTES = 1024 * 1024;

/** Settings → Website: upload a logo (stored in the database as a small data: URL), or remove it. */
export async function saveLogo(_prev: FormState, form: FormData): Promise<FormState> {
  try {
    await requireAdmin();
    await ensureSchemaPatches();
    let logoData: string | null = null;
    if (form.get("remove") !== "1") {
      const file = form.get("logo");
      if (!(file instanceof File) || file.size === 0) return { error: "Choose an image first." };
      if (!LOGO_TYPES.includes(file.type)) return { error: "Use a PNG, JPG, WebP, GIF or SVG image." };
      if (file.size > MAX_LOGO_BYTES) return { error: "That image is over 1 MB. A square image around 512×512 is plenty." };
      logoData = `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`;
    }
    await db
      .insert(schema.siteSettings)
      .values({ id: 1, logoData })
      .onConflictDoUpdate({ target: schema.siteSettings.id, set: { logoData, updatedAt: new Date() } });
    revalidatePath("/", "layout");
    return { saved: true };
  } catch (error) {
    return { error: (error as Error).message };
  }
}
