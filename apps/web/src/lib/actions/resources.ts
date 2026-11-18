"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@yaos/database";
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
    const slugClash = await db.select({ id: schema.resources.id }).from(schema.resources).where(id ? and(eq(schema.resources.slug, slug), ne(schema.resources.id, id)) : eq(schema.resources.slug, slug));
    if (slugClash.length) return { error: `The page address /r/${slug} is taken. Change the page address.` };

    const values = {
      title,
      slug,
      keywords,
      summary: str(form, "summary") || null,
      body,
      link: optionalUrl(str(form, "link"), "Extra link"),
      videoUrl: optionalUrl(str(form, "videoUrl"), "Video link"),
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
  await requireAdmin();
  try {
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
