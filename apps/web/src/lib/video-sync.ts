import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { db, ensureSchemaPatches, schema } from "@yaos/database";
import {
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
  /** Leave undefined to keep whatever is stored. */
  format?: "LONG" | "SHORT" | "REEL" | "POST";
  durationSeconds?: number | null;
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
    ...(v.format ? { format: v.format } : {}),
    ...(v.durationSeconds !== undefined ? { durationSeconds: v.durationSeconds } : {}),
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

/** "PT1H2M3S" -> 3723. Returns null for anything unparseable (e.g. live streams "P0D"). */
export function parseIsoDuration(iso: string | undefined): number | null {
  const m = iso?.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)(?:\.\d+)?S)?)?$/);
  if (!m) return null;
  const [, d, h, min, sec] = m;
  const total = Number(d ?? 0) * 86400 + Number(h ?? 0) * 3600 + Number(min ?? 0) * 60 + Number(sec ?? 0);
  return total || null;
}

/**
 * YouTube's API doesn't say whether a video is a Short. youtube.com/shorts/<id> answers 200 for a
 * Short and redirects to /watch for a normal video, so ask it. null = couldn't tell.
 */
async function shortsUrlSaysShort(id: string): Promise<boolean | null> {
  try {
    const res = await fetch(`https://www.youtube.com/shorts/${id}`, { method: "HEAD", redirect: "manual" });
    if (res.status === 200) return true;
    const location = res.headers.get("location") ?? "";
    if (res.status >= 300 && res.status < 400 && location.includes("/watch")) return false;
    return null;
  } catch {
    return null;
  }
}

/** Shorts are at most 3 minutes. Anything longer is long-form without asking YouTube. */
export function classifyYouTube(durationSeconds: number | null, shortsCheck: boolean | null, title: string): "LONG" | "SHORT" {
  if (durationSeconds !== null && durationSeconds > 180) return "LONG";
  if (shortsCheck !== null) return shortsCheck ? "SHORT" : "LONG";
  if (/#shorts?\b/i.test(title)) return "SHORT";
  return durationSeconds !== null && durationSeconds <= 60 ? "SHORT" : "LONG";
}

async function inBatches<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += size) out.push(...(await Promise.all(items.slice(i, i + size).map(fn))));
  return out;
}

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
    const items = (page.items ?? []).filter((item) => {
      const id = item.contentDetails?.videoId;
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
    const ids = items.map((item) => item.contentDetails!.videoId!);
    if (!ids.length) return page.nextPageToken ?? null;

    // Only classify videos we haven't classified before (one videos.list call, 1 quota unit per 50).
    const known = new Set(
      (
        await db
          .select({ externalId: schema.videos.externalId })
          .from(schema.videos)
          .where(and(eq(schema.videos.platform, "YOUTUBE"), inArray(schema.videos.externalId, ids), isNotNull(schema.videos.format)))
      ).map((r) => r.externalId),
    );
    const toClassify = ids.filter((id) => !known.has(id));
    const formats = new Map<string, { format: "LONG" | "SHORT"; durationSeconds: number | null }>();
    if (toClassify.length) {
      const details = await ytGet<{ items?: { id: string; contentDetails?: { duration?: string } }[] }>(
        "videos",
        { part: "contentDetails", id: toClassify.join(","), maxResults: "50" },
        token,
      );
      const durations = new Map((details.items ?? []).map((d) => [d.id, parseIsoDuration(d.contentDetails?.duration)]));
      const titles = new Map(items.map((item) => [item.contentDetails!.videoId!, item.snippet?.title ?? ""]));
      await inBatches(toClassify, 8, async (id) => {
        const duration = durations.get(id) ?? null;
        const check = duration !== null && duration > 180 ? false : await shortsUrlSaysShort(id);
        formats.set(id, { format: classifyYouTube(duration, check, titles.get(id) ?? ""), durationSeconds: duration });
      });
    }

    for (const item of items) {
      const id = item.contentDetails!.videoId!;
      const thumbs = item.snippet?.thumbnails ?? {};
      const published = item.contentDetails?.videoPublishedAt ?? item.snippet?.publishedAt;
      const classified = formats.get(id);
      const result = await upsertVideo({
        platform: "YOUTUBE",
        externalId: id,
        title: item.snippet?.title ?? "Untitled video",
        description: item.snippet?.description ?? null,
        watchUrl: `https://youtu.be/${id}`,
        thumbnailUrl: (thumbs.high ?? thumbs.medium ?? thumbs.default)?.url ?? null,
        publishedAt: published ? new Date(published) : null,
        ...(classified ? { format: classified.format, durationSeconds: classified.durationSeconds } : {}),
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
  media_product_type?: string;
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
        thumbnailUrl: m.thumbnail_url ?? (m.media_type === "IMAGE" || m.media_type === "CAROUSEL_ALBUM" ? m.media_url ?? null : null),
        publishedAt: when,
        format: m.media_product_type === "REELS" ? "REEL" : "POST",
      });
      counts[result]++;
    }
    return json.paging?.next ?? null;
  };

  const firstUrl = `${base}/${conn.accountId}/media?${new URLSearchParams({
    fields: "id,caption,permalink,media_type,media_product_type,media_url,thumbnail_url,timestamp",
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

// ---------------------------------------------------------------- Followers / subscribers

export interface StatsReport {
  youtube?: { subscribers: number | null; videos: number | null; views: number | null } | { error: string };
  instagram?: { followers: number | null; posts: number | null } | { error: string };
}

async function saveStats(platform: "YOUTUBE" | "INSTAGRAM", followers: number | null, posts: number | null, views: number | null) {
  const day = new Date().toISOString().slice(0, 10);
  await db
    .insert(schema.channelStats)
    .values({ platform, day, followers, posts, views })
    .onConflictDoUpdate({
      target: [schema.channelStats.platform, schema.channelStats.day],
      set: { followers, posts, views, updatedAt: new Date() },
    });
}

const num = (v: unknown): number | null => (v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? null : Number(v));

async function syncStats(yt: ConnectionRow | null, ig: ConnectionRow | null): Promise<StatsReport> {
  const report: StatsReport = {};
  if (yt) {
    try {
      const token = await youtubeAccessToken(yt);
      const json = await ytGet<{ items?: { statistics?: { subscriberCount?: string; videoCount?: string; viewCount?: string; hiddenSubscriberCount?: boolean } }[] }>(
        "channels",
        { part: "statistics", id: yt.accountId },
        token,
      );
      const st = json.items?.[0]?.statistics;
      const row = { subscribers: st?.hiddenSubscriberCount ? null : num(st?.subscriberCount), videos: num(st?.videoCount), views: num(st?.viewCount) };
      await saveStats("YOUTUBE", row.subscribers, row.videos, row.views);
      report.youtube = row;
    } catch (e) {
      report.youtube = { error: (e as Error).message };
    }
  }
  if (ig?.accessToken) {
    try {
      const base = instagramGraphBase((ig.metadata as { mode?: InstagramMode } | null)?.mode);
      const res = await fetch(`${base}/${ig.accountId}?${new URLSearchParams({ fields: "followers_count,media_count", access_token: ig.accessToken })}`);
      const json = (await res.json()) as { followers_count?: number; media_count?: number; error?: { message?: string } };
      if (!res.ok) throw new Error(`Instagram profile failed (${res.status}): ${json.error?.message ?? "unknown error"}`);
      const row = { followers: num(json.followers_count), posts: num(json.media_count) };
      await saveStats("INSTAGRAM", row.followers, row.posts, null);
      report.instagram = row;
    } catch (e) {
      report.instagram = { error: (e as Error).message };
    }
  }
  return report;
}

export interface SyncReport {
  stats?: StatsReport;
  youtube?: { created: number; updated: number; more: boolean } | { skipped: string } | { error: string };
  instagram?: { created: number; updated: number; more: boolean } | { skipped: string } | { error: string };
}

/** Runs both platforms. A failure on one never stops the other. */
export async function runVideoSync(): Promise<SyncReport> {
  await ensureSchemaPatches();
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
  report.stats = await syncStats(yt, ig);
  return report;
}
