import { eq } from "drizzle-orm";
import { db, schema } from "@yaos/database";
import {
  FB_GRAPH,
  getConnection,
  instagramGraphBase,
  youtubeAccessToken,
  type ConnectionRow,
  type InstagramMode,
} from "@yaos/comment-bot";
import { slugify } from "@/lib/site";

/**
 * Pulls every video from the connected YouTube channel and Instagram account into the `videos`
 * table. Each run reads the newest page (so new uploads show up within the hour) and then walks
 * the back catalogue a few pages at a time, so large channels fill in over a few hours.
 */

const PAGES_PER_RUN = 4;

interface VideoInput {
  platform: "YOUTUBE" | "INSTAGRAM";
  externalId: string;
  title: string;
  description: string | null;
  watchUrl: string;
  thumbnailUrl: string | null;
  publishedAt: Date | null;
}

interface SyncState {
  ytCursor?: string | null;
  igCursor?: string | null;
  lastSyncAt?: string;
  lastCounts?: Record<string, number>;
  lastError?: string | null;
}

async function readState(conn: ConnectionRow | null): Promise<SyncState> {
  return ((conn?.metadata as { sync?: SyncState } | null)?.sync ?? {}) as SyncState;
}

async function writeState(platform: "YOUTUBE" | "INSTAGRAM", patch: SyncState): Promise<void> {
  const conn = await getConnection(platform);
  if (!conn) return;
  const sync = { ...((conn.metadata as { sync?: SyncState } | null)?.sync ?? {}), ...patch };
  await db
    .update(schema.socialConnections)
    .set({ metadata: { ...((conn.metadata as object | null) ?? {}), sync }, updatedAt: new Date() })
    .where(eq(schema.socialConnections.platform, platform));
}

/** Creates or refreshes one video. Creator-owned fields (keyword, prompt, hidden) are never touched. */
async function upsertVideo(v: VideoInput): Promise<"created" | "updated"> {
  const [existing] = await db
    .select({ id: schema.videos.id })
    .from(schema.videos)
    .where(eq(schema.videos.externalId, v.externalId));
  const platformFields = {
    title: v.title.slice(0, 300),
    description: v.description,
    watchUrl: v.watchUrl,
    thumbnailUrl: v.thumbnailUrl,
    publishedAt: v.publishedAt,
    updatedAt: new Date(),
  };
  if (existing) {
    await db.update(schema.videos).set(platformFields).where(eq(schema.videos.id, existing.id));
    return "updated";
  }
  const suffix = v.externalId.slice(-6).toLowerCase();
  const slug = `${slugify(v.title).slice(0, 60) || "video"}-${suffix}`;
  await db.insert(schema.videos).values({ ...platformFields, platform: v.platform, externalId: v.externalId, slug });
  return "created";
}

function captionTitle(caption: string, fallbackDate: Date | null): string {
  const first = caption.split("\n").map((l) => l.trim()).find(Boolean);
  if (first) return first.length > 120 ? `${first.slice(0, 117)}…` : first;
  return `Instagram post${fallbackDate ? ` (${fallbackDate.toISOString().slice(0, 10)})` : ""}`;
}

// ---------------------------------------------------------------- YouTube

async function ytGet<T>(path: string, params: Record<string, string>, token: string): Promise<T> {
  const res = await fetch(`https://www.googleapis.com/youtube/v3/${path}?${new URLSearchParams(params)}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  const json = (await res.json()) as T & { error?: { message?: string } };
  if (!res.ok) throw new Error(`YouTube ${path} failed (${res.status}): ${json.error?.message ?? "unknown error"}`);
  return json;
}

interface PlaylistItem {
  contentDetails?: { videoId?: string; videoPublishedAt?: string };
  snippet?: {
    title?: string;
    description?: string;
    publishedAt?: string;
    thumbnails?: Record<string, { url?: string }>;
  };
}

async function syncYouTube(conn: ConnectionRow): Promise<{ created: number; updated: number; more: boolean }> {
  const token = await youtubeAccessToken(conn);
  const channel = await ytGet<{ items?: { contentDetails?: { relatedPlaylists?: { uploads?: string } } }[] }>(
    "channels",
    { part: "contentDetails", id: conn.accountId },
    token,
  );
  const uploads = channel.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) throw new Error("Could not find the channel's uploads playlist.");

  const state = await readState(conn);
  const counts = { created: 0, updated: 0, more: false };
  const seen = new Set<string>();

  /** Reads one page, saves its videos, and returns the token of the next page (or null at the end). */
  const fetchPage = async (pageToken?: string): Promise<string | null> => {
    const page = await ytGet<{ items?: PlaylistItem[]; nextPageToken?: string }>(
      "playlistItems",
      { part: "snippet,contentDetails", playlistId: uploads, maxResults: "50", ...(pageToken ? { pageToken } : {}) },
      token,
    );
    for (const item of page.items ?? []) {
      const id = item.contentDetails?.videoId;
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const thumbs = item.snippet?.thumbnails ?? {};
      const published = item.contentDetails?.videoPublishedAt ?? item.snippet?.publishedAt;
      const result = await upsertVideo({
        platform: "YOUTUBE",
        externalId: id,
        title: item.snippet?.title ?? "Untitled video",
        description: item.snippet?.description ?? null,
        watchUrl: `https://youtu.be/${id}`,
        thumbnailUrl: (thumbs.high ?? thumbs.medium ?? thumbs.default)?.url ?? null,
        publishedAt: published ? new Date(published) : null,
      });
      counts[result]++;
    }
    return page.nextPageToken ?? null;
  };

  // 1. Always read the newest page, so new uploads appear within the hour.
  await fetchPage(undefined);
  // 2. Then walk the back catalogue from the saved cursor, a few pages per run.
  let pageToken: string | undefined = state.ytCursor ?? undefined;
  let next: string | null = null;
  for (let pages = 0; pages < PAGES_PER_RUN; pages++) {
    next = await fetchPage(pageToken);
    if (!next) break;
    pageToken = next;
  }
  // `next` is the page still to read; null means the catalogue is finished and the next run starts over.
  counts.more = Boolean(next);
  await writeState("YOUTUBE", { ytCursor: next, lastSyncAt: new Date().toISOString(), lastCounts: { created: counts.created, updated: counts.updated }, lastError: null });
  return counts;
}

// ---------------------------------------------------------------- Instagram

interface IgMedia {
  id: string;
  caption?: string;
  permalink?: string;
  media_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  timestamp?: string;
}

async function syncInstagram(conn: ConnectionRow): Promise<{ created: number; updated: number; more: boolean }> {
  if (!conn.accessToken) throw new Error("Instagram is not connected.");
  const mode = (conn.metadata as { mode?: InstagramMode } | null)?.mode;
  const base = instagramGraphBase(mode);
  const state = await readState(conn);
  const counts = { created: 0, updated: 0, more: false };
  const seen = new Set<string>();

  const fetchUrl = async (url: string): Promise<string | null> => {
    const res = await fetch(url);
    const json = (await res.json()) as { data?: IgMedia[]; paging?: { next?: string }; error?: { message?: string } };
    if (!res.ok) throw new Error(`Instagram media failed (${res.status}): ${json.error?.message ?? "unknown error"}`);
    for (const m of json.data ?? []) {
      if (seen.has(m.id)) continue;
      seen.add(m.id);
      const caption = m.caption ?? "";
      const when = m.timestamp ? new Date(m.timestamp) : null;
      const result = await upsertVideo({
        platform: "INSTAGRAM",
        externalId: String(m.id),
        title: captionTitle(caption, when),
        description: caption || null,
        watchUrl: m.permalink ?? `https://www.instagram.com/`,
        thumbnailUrl: m.thumbnail_url ?? (m.media_type === "IMAGE" ? m.media_url ?? null : null),
        publishedAt: when,
      });
      counts[result]++;
    }
    return json.paging?.next ?? null;
  };

  const firstUrl = `${base}/${conn.accountId}/media?${new URLSearchParams({
    fields: "id,caption,permalink,media_type,media_url,thumbnail_url,timestamp",
    limit: "50",
    access_token: conn.accessToken,
  })}`;
  await fetchUrl(firstUrl); // newest first

  let next: string | null = state.igCursor ?? firstUrl;
  let pages = 0;
  while (next && pages < PAGES_PER_RUN) {
    next = await fetchUrl(next);
    pages++;
    if (!next) break;
  }
  counts.more = Boolean(next);
  await writeState("INSTAGRAM", { igCursor: next, lastSyncAt: new Date().toISOString(), lastCounts: { created: counts.created, updated: counts.updated }, lastError: null });
  return counts;
}

export interface SyncReport {
  youtube?: { created: number; updated: number; more: boolean } | { skipped: string } | { error: string };
  instagram?: { created: number; updated: number; more: boolean } | { skipped: string } | { error: string };
}

/** Runs both platforms. A failure on one never stops the other. */
export async function runVideoSync(): Promise<SyncReport> {
  const report: SyncReport = {};
  const yt = await getConnection("YOUTUBE");
  report.youtube = yt ? await syncYouTube(yt).catch(async (e: Error) => {
    await writeState("YOUTUBE", { lastError: e.message });
    return { error: e.message };
  }) : { skipped: "not connected" };
  const ig = await getConnection("INSTAGRAM");
  report.instagram = ig?.accessToken ? await syncInstagram(ig).catch(async (e: Error) => {
    await writeState("INSTAGRAM", { lastError: e.message });
    return { error: e.message };
  }) : { skipped: "not connected" };
  return report;
}
