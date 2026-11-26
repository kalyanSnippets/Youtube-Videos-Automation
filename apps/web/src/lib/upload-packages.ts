import { desc, eq, gte } from "drizzle-orm";
import { db, ensureSchemaPatches, schema } from "@yaos/database";
import { bestMatches, clearPromptLibraryCache, parseUploadPackage, splitKeywords, type PlannedPost } from "@yaos/comment-bot";

/**
 * Upload packages: Claude's per-video posting notes, imported once. Each video in a package that
 * offers something in the comments becomes a planned post. As soon as the real video shows up
 * (now, or in the hourly sync), its card gets the keyword and prompt and its bot is switched on.
 */

type PlannedRow = typeof schema.plannedPosts.$inferSelect;
type VideoRow = typeof schema.videos.$inferSelect;

/** Planned posts keep looking for their videos this long after import. */
const LOOK_FOR_DAYS = 45;

export interface ImportSummary {
  added: { label: string; keywords: string[] }[];
  skipped: { label: string; reason: string }[];
  applied: string[];
}

export async function importUploadPackage(markdown: string): Promise<ImportSummary> {
  await ensureSchemaPatches();
  const parsed = parseUploadPackage(markdown);
  const existing = await db.select().from(schema.plannedPosts);
  const added: ImportSummary["added"] = [];
  for (const post of parsed.posts) {
    // Importing the same package twice updates the earlier copy instead of adding a duplicate.
    const same = existing.find((e) => e.label === post.label && (e.youtubeTitle ?? "") === (post.youtubeTitle ?? ""));
    const values = {
      label: post.label.slice(0, 300),
      youtubeTitle: post.youtubeTitle?.slice(0, 300) ?? null,
      instagramCaption: post.instagramCaption,
      keywords: post.keywords.join(", ").slice(0, 300),
      promptName: post.promptName?.slice(0, 200) ?? null,
      prompt: post.prompt!,
      extraLink: post.extraLink?.slice(0, 500) ?? null,
      updatedAt: new Date(),
    };
    if (same) await db.update(schema.plannedPosts).set(values).where(eq(schema.plannedPosts.id, same.id));
    else await db.insert(schema.plannedPosts).values(values);
    added.push({ label: post.label, keywords: post.keywords });
  }
  const applied = await applyPlannedPosts();
  return { added, skipped: parsed.skipped, applied };
}

function asPost(row: PlannedRow): PlannedPost {
  return {
    label: row.label,
    youtubeTitle: row.youtubeTitle,
    instagramCaption: row.instagramCaption,
    keywords: splitKeywords(row.keywords),
    promptName: row.promptName,
    prompt: row.prompt,
    extraLink: row.extraLink,
  };
}

/**
 * Put a planned post onto a video. A prompt you already gave the video by hand is never replaced;
 * the post just notes that.
 */
async function applyTo(row: PlannedRow, video: VideoRow): Promise<string> {
  const name = `${video.platform === "YOUTUBE" ? "YouTube" : "Instagram"} “${video.title.slice(0, 60)}”`;
  const hasOwnPrompt = Boolean(video.prompt?.trim() || video.attachmentName);
  let note: string;
  if (hasOwnPrompt) {
    note = `${name} already had its own prompt, so it was left as is.`;
  } else {
    const keywords = [...new Set([...splitKeywords(video.keyword), ...splitKeywords(row.keywords)])];
    await db
      .update(schema.videos)
      .set({
        keyword: keywords.join(", "),
        prompt: row.prompt,
        promptSource: "package",
        promptFilename: null,
        resourceTitle: video.resourceTitle ?? row.promptName,
        extraLink: video.extraLink ?? row.extraLink,
        botEnabled: true,
        updatedAt: new Date(),
      })
      .where(eq(schema.videos.id, video.id));
    note = `Set up ${name}: ${keywords.join(", ")} and bot on.`;
  }
  await db
    .update(schema.plannedPosts)
    .set({ matchedVideoIds: [...row.matchedVideoIds, video.id], note, updatedAt: new Date() })
    .where(eq(schema.plannedPosts.id, row.id));
  row.matchedVideoIds = [...row.matchedVideoIds, video.id];
  return note;
}

/** Match waiting planned posts to videos that have appeared. Returns what was done, for logs and the page. */
export async function applyPlannedPosts(): Promise<string[]> {
  await ensureSchemaPatches();
  const since = new Date(Date.now() - LOOK_FOR_DAYS * 86_400_000);
  const [rows, videos] = await Promise.all([
    db.select().from(schema.plannedPosts).where(gte(schema.plannedPosts.createdAt, since)).orderBy(desc(schema.plannedPosts.createdAt)),
    db.select().from(schema.videos).where(eq(schema.videos.hidden, false)),
  ]);
  const claimed = new Set(rows.flatMap((r) => r.matchedVideoIds));
  const done: string[] = [];
  for (const row of rows) {
    const platformsDone = new Set(videos.filter((v) => row.matchedVideoIds.includes(v.id)).map((v) => v.platform));
    const open = videos.filter((v) => !claimed.has(v.id) && !platformsDone.has(v.platform));
    for (const video of bestMatches(asPost(row), open)) {
      done.push(await applyTo(row, video));
      claimed.add(video.id);
    }
  }
  if (done.length) clearPromptLibraryCache();
  return done;
}

/** The creator picked the video by hand. */
export async function linkPlannedPost(postId: string, videoId: string): Promise<string> {
  const [row] = await db.select().from(schema.plannedPosts).where(eq(schema.plannedPosts.id, postId));
  const [video] = await db.select().from(schema.videos).where(eq(schema.videos.id, videoId));
  if (!row || !video) throw new Error("That package item or video no longer exists. Refresh the page.");
  if (row.matchedVideoIds.includes(video.id)) return "Already linked.";
  // Replace an earlier match on the same platform (it was the wrong video): undo what it filled in there.
  const earlier = await db.select().from(schema.videos).where(eq(schema.videos.platform, video.platform));
  for (const wrong of earlier.filter((v) => row.matchedVideoIds.includes(v.id))) {
    if (wrong.promptSource === "package" && wrong.prompt === row.prompt) {
      await db
        .update(schema.videos)
        .set({ keyword: null, prompt: null, promptSource: null, resourceTitle: null, botEnabled: false, updatedAt: new Date() })
        .where(eq(schema.videos.id, wrong.id));
    }
    row.matchedVideoIds = row.matchedVideoIds.filter((id) => id !== wrong.id);
  }
  const note = await applyTo(row, video);
  clearPromptLibraryCache();
  return note;
}

export async function listPlannedPosts(): Promise<PlannedRow[]> {
  await ensureSchemaPatches();
  return db.select().from(schema.plannedPosts).orderBy(desc(schema.plannedPosts.createdAt)).catch(() => []);
}

export async function deletePlannedPost(id: string): Promise<void> {
  await db.delete(schema.plannedPosts).where(eq(schema.plannedPosts.id, id));
}
