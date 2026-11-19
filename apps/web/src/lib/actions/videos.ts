"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, ensureSchemaPatches, schema } from "@yaos/database";
import { clearPromptLibraryCache, normaliseKeyword } from "@yaos/comment-bot";
import { requireAdmin } from "@/lib/admin";
import { fetchGoogleDoc, googleDocId, readUpload, takeKeywordLine, tidy } from "@/lib/prompt-import";
import { runVideoSync, type SyncReport } from "@/lib/video-sync";

export interface VideoFormState {
  error?: string;
  saved?: string;
}

export interface ImportResult {
  error?: string;
  text?: string;
  keyword?: string | null;
  source?: string;
  filename?: string | null;
}

function refresh() {
  clearPromptLibraryCache();
  revalidatePath("/videos");
  revalidatePath("/", "layout");
}

function optionalUrl(value: string): string | null {
  if (!value) return null;
  const u = new URL(value); // throws on junk
  if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error("not http");
  return u.toString();
}

/**
 * Step 1 of adding a prompt: turn an uploaded file or a Google Doc link into text.
 * Nothing is saved; the text goes into the editor so you can check it before saving.
 */
export async function importPrompt(form: FormData): Promise<ImportResult> {
  try {
    await requireAdmin();
    const file = form.get("file");
    const docLink = String(form.get("docLink") ?? "").trim();
    if (file instanceof File && file.size > 0) {
      const r = await readUpload(file);
      if (!r.text) return { error: "That file had no text in it." };
      return { text: r.text, keyword: r.keyword, source: r.source, filename: r.filename };
    }
    if (docLink) {
      if (!googleDocId(docLink)) return { error: "That doesn't look like a Google Docs link." };
      const { keyword, text } = takeKeywordLine(tidy(await fetchGoogleDoc(docLink)));
      if (!text) return { error: "That doc is empty." };
      return { text, keyword, source: "google-doc", filename: null };
    }
    return { error: "Choose a file or paste a Google Doc link first." };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

/** Old standalone resources can't share a keyword with a video they're not about. */
async function legacyResourceClash(keyword: string, watchUrls: string[]): Promise<string | null> {
  const rows = await db
    .select({ title: schema.resources.title, keywords: schema.resources.keywords, videoUrl: schema.resources.videoUrl, instagramUrl: schema.resources.instagramUrl, published: schema.resources.published })
    .from(schema.resources);
  const clash = rows.find(
    (r) => r.published && (r.keywords ?? []).includes(keyword) && !watchUrls.includes(r.videoUrl ?? "") && !watchUrls.includes(r.instagramUrl ?? ""),
  );
  return clash ? `Keyword ${keyword} is still used by the old resource "${clash.title}". Move it into a video first (box at the top of this page), or pick another keyword.` : null;
}

/** Step 2: save the prompt (and optionally copy it to the same video on the other platform). */
export async function saveVideo(_prev: VideoFormState, form: FormData): Promise<VideoFormState> {
  try {
    await requireAdmin();
    await ensureSchemaPatches();
    const id = String(form.get("id") ?? "");
    const [video] = await db.select().from(schema.videos).where(eq(schema.videos.id, id));
    if (!video) return { error: "That video no longer exists. Refresh the page." };

    const prompt = tidy(String(form.get("prompt") ?? ""));
    const keyword = normaliseKeyword(String(form.get("keyword") ?? "")) || null;
    const resourceTitle = String(form.get("resourceTitle") ?? "").trim().slice(0, 200) || null;
    let extraLink: string | null;
    try {
      extraLink = optionalUrl(String(form.get("extraLink") ?? "").trim());
    } catch {
      return { error: "The extra link must be a full address starting with https://" };
    }
    const hidden = form.get("hidden") === "on";
    const twinId = String(form.get("twinId") ?? "");
    const [twin] = twinId ? await db.select().from(schema.videos).where(eq(schema.videos.id, twinId)) : [];

    if (keyword) {
      const clash = await legacyResourceClash(keyword, [video.watchUrl, twin?.watchUrl ?? ""].filter(Boolean));
      if (clash) return { error: clash };
    }

    const promptChanged = prompt !== (video.prompt ?? "");
    const fields = {
      keyword,
      resourceTitle,
      extraLink,
      prompt: prompt || null,
      promptSource: prompt ? (promptChanged ? String(form.get("promptSource") ?? "") || "text" : video.promptSource) : null,
      promptFilename: prompt ? (promptChanged ? String(form.get("promptFilename") ?? "") || null : video.promptFilename) : null,
      updatedAt: new Date(),
    };
    await db.update(schema.videos).set({ ...fields, hidden }).where(eq(schema.videos.id, video.id));
    if (twin) await db.update(schema.videos).set(fields).where(eq(schema.videos.id, twin.id));
    refresh();
    const where = twin ? ` Also added to the ${twin.platform === "INSTAGRAM" ? "Instagram" : "YouTube"} version.` : "";
    if (prompt) return { saved: `Saved.${where}` };
    return {
      saved: keyword
        ? `Saved. Comments with ${keyword} get the link to this video's page now; add the prompt when it's ready.${where}`
        : `Saved (no prompt yet, so it shows "Prompt coming soon").${where}`,
    };
  } catch (error) {
    console.error("[videos] save failed", error);
    const message = (error as Error).message;
    return { error: /not signed in/i.test(message) ? "You've been signed out. Reload the page and sign in again." : `Couldn't save: ${message}` };
  }
}

/** Moves an old standalone resource onto a video (and its twin), then removes the old resource. */
export async function moveResourceToVideo(form: FormData): Promise<void> {
  await requireAdmin();
  await ensureSchemaPatches();
  const resourceId = String(form.get("resourceId") ?? "");
  const videoIds = form.getAll("videoId").map(String).filter(Boolean);
  const [resource] = await db.select().from(schema.resources).where(eq(schema.resources.id, resourceId));
  if (!resource || !videoIds.length) return;
  for (const videoId of videoIds) {
    await db
      .update(schema.videos)
      .set({
        prompt: resource.body,
        promptSource: "text",
        promptFilename: null,
        keyword: resource.keywords?.[0] ?? null,
        resourceTitle: resource.title,
        extraLink: resource.link,
        updatedAt: new Date(),
      })
      .where(eq(schema.videos.id, videoId));
  }
  await db.delete(schema.resources).where(eq(schema.resources.id, resourceId));
  refresh();
}

export async function removeVideoPrompt(form: FormData): Promise<void> {
  await requireAdmin();
  const id = String(form.get("id") ?? "");
  if (id) {
    await db
      .update(schema.videos)
      .set({ prompt: null, promptSource: null, promptFilename: null, keyword: null, updatedAt: new Date() })
      .where(eq(schema.videos.id, id));
  }
  refresh();
}

/** "Sync now" button on the Videos page. Same job the hourly schedule runs. */
export async function syncVideosNow(): Promise<SyncReport> {
  await requireAdmin();
  const report = await runVideoSync();
  refresh();
  return report;
}
