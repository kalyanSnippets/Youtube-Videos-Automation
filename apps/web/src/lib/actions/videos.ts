"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@yaos/database";
import { clearPromptLibraryCache, normaliseKeyword } from "@yaos/comment-bot";
import { requireAdmin } from "@/lib/admin";
import { fetchGoogleDoc, googleDocId, readUpload, tidy, takeKeywordLine, type ImportedPrompt } from "@/lib/prompt-import";
import { runVideoSync, type SyncReport } from "@/lib/video-sync";

export interface VideoFormState {
  error?: string;
  saved?: string;
}

function refresh(videoId?: string) {
  clearPromptLibraryCache();
  revalidatePath("/videos");
  revalidatePath("/", "layout");
  revalidatePath("/v", "layout");
  if (videoId) revalidatePath(`/videos`);
}

/** Keyword must be unique across videos and resources, because the bot needs one answer per word. */
async function keywordClash(keyword: string, videoId: string): Promise<string | null> {
  const [video] = await db
    .select({ title: schema.videos.title })
    .from(schema.videos)
    .where(and(eq(schema.videos.keyword, keyword), ne(schema.videos.id, videoId)))
    .limit(1);
  if (video) return `Keyword ${keyword} is already used by the video "${video.title}".`;
  const resources = await db.select({ title: schema.resources.title, keywords: schema.resources.keywords }).from(schema.resources);
  const resource = resources.find((r) => (r.keywords ?? []).includes(keyword));
  if (resource) return `Keyword ${keyword} is already used by the resource "${resource.title}".`;
  return null;
}

/**
 * One form per video card: keyword, prompt (file, Google Doc link or pasted text), hidden flag.
 * Any prompt source converts to plain text and is stored on the video.
 */
export async function saveVideo(_prev: VideoFormState, form: FormData): Promise<VideoFormState> {
  await requireAdmin();
  const videoId = String(form.get("id") ?? "");
  const [video] = await db.select().from(schema.videos).where(eq(schema.videos.id, videoId));
  if (!video) return { error: "That video no longer exists. Refresh the page." };

  try {
    let imported: ImportedPrompt | null = null;
    const file = form.get("file");
    const docLink = String(form.get("docLink") ?? "").trim();
    const pasted = String(form.get("pasted") ?? "").trim();
    if (file instanceof File && file.size > 0) {
      imported = await readUpload(file);
    } else if (docLink) {
      if (!googleDocId(docLink)) return { error: "That doesn't look like a Google Docs link." };
      const { keyword, text } = takeKeywordLine(tidy(await fetchGoogleDoc(docLink)));
      imported = { text, source: "google-doc", filename: null, keyword };
    } else if (pasted) {
      const { keyword, text } = takeKeywordLine(tidy(pasted));
      imported = { text, source: "text", filename: null, keyword };
    }

    const typedKeyword = normaliseKeyword(String(form.get("keyword") ?? ""));
    const keyword = typedKeyword || imported?.keyword || video.keyword || null;
    if (keyword) {
      const clash = await keywordClash(keyword, video.id);
      if (clash) return { error: clash };
    }
    const hidden = form.get("hidden") === "on";

    const update: Partial<typeof schema.videos.$inferInsert> = { keyword, hidden, updatedAt: new Date() };
    if (imported) {
      if (!imported.text) return { error: "That file had no text in it." };
      update.prompt = imported.text;
      update.promptSource = imported.source;
      update.promptFilename = imported.filename;
    }
    await db.update(schema.videos).set(update).where(eq(schema.videos.id, video.id));
    refresh(video.id);
    const what = imported ? `Prompt saved (${imported.text.length.toLocaleString()} characters).` : "Saved.";
    return { saved: what };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

export async function removeVideoPrompt(form: FormData): Promise<void> {
  await requireAdmin();
  const id = String(form.get("id") ?? "");
  if (id) {
    await db
      .update(schema.videos)
      .set({ prompt: null, promptSource: null, promptFilename: null, updatedAt: new Date() })
      .where(eq(schema.videos.id, id));
  }
  refresh(id);
}

/** "Sync now" button on the Videos page. Same job the hourly schedule runs. */
export async function syncVideosNow(): Promise<SyncReport> {
  await requireAdmin();
  const report = await runVideoSync();
  refresh();
  return report;
}
