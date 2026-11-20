import { and, eq } from "drizzle-orm";
import { db, schema } from "@yaos/database";
import { getConnection, hasAnalyticsScope, youtubeAccessToken, type ConnectionRow } from "@yaos/comment-bot";

/**
 * YouTube Analytics API v2: per-video lifetime totals and the channel's last 28 days.
 * Needs the yt-analytics.readonly scope (granted when YouTube is (re)connected).
 * Analytics data lags a day or two behind YouTube Studio; refreshed every few hours.
 */
const API = "https://youtubeanalytics.googleapis.com/v2/reports";
const REFRESH_EVERY_MS = 6 * 60 * 60 * 1000;

interface Report {
  columnHeaders?: { name: string }[];
  rows?: (string | number)[][];
}

async function report(token: string, params: Record<string, string>): Promise<Record<string, string | number>[]> {
  const res = await fetch(`${API}?${new URLSearchParams({ ids: "channel==MINE", ...params })}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  const json = (await res.json()) as Report & { error?: { message?: string; status?: string } };
  if (!res.ok) {
    const msg = json.error?.message ?? `HTTP ${res.status}`;
    if (res.status === 403 && /scope|permission|insufficient/i.test(msg)) {
      throw new Error("YouTube hasn't given analytics access yet. Reconnect YouTube (Comment Bot → Setup) and tick the analytics permission.");
    }
    if (res.status === 403 && /not been used|disabled|SERVICE_DISABLED/i.test(msg + (json.error?.status ?? ""))) {
      throw new Error("Turn on the 'YouTube Analytics API' in Google Cloud (APIs & Services → Library), then wait a few minutes.");
    }
    throw new Error(`YouTube Analytics failed: ${msg}`);
  }
  const names = (json.columnHeaders ?? []).map((c) => c.name);
  return (json.rows ?? []).map((row) => Object.fromEntries(row.map((v, i) => [names[i]!, v])));
}

const day = (d: Date) => d.toISOString().slice(0, 10);
const int = (v: unknown) => (v === undefined || v === null || Number.isNaN(Number(v)) ? null : Math.round(Number(v)));

export interface AnalyticsState {
  lastAt?: string;
  lastError?: string | null;
}

export function analyticsState(conn: ConnectionRow | null): AnalyticsState {
  return ((conn?.metadata as { analytics?: AnalyticsState } | null)?.analytics ?? {}) as AnalyticsState;
}

async function saveState(conn: ConnectionRow, patch: AnalyticsState) {
  const fresh = await getConnection("YOUTUBE");
  const metadata = (fresh?.metadata as Record<string, unknown> | null) ?? {};
  await db
    .update(schema.socialConnections)
    .set({ metadata: { ...metadata, analytics: { ...analyticsState(fresh ?? conn), ...patch } }, updatedAt: new Date() })
    .where(eq(schema.socialConnections.platform, "YOUTUBE"));
}

export type AnalyticsResult = { updatedVideos: number; days: number } | { skipped: string } | { error: string };

/** Refreshes per-video totals and the last 28 days. Runs at most every 6 hours unless forced. */
export async function syncYouTubeAnalytics(options: { force?: boolean } = {}): Promise<AnalyticsResult> {
  const conn = await getConnection("YOUTUBE");
  if (!conn) return { skipped: "YouTube not connected" };
  const state = analyticsState(conn);
  const meta = conn.metadata as { scopes?: string } | null;
  // Connections made before analytics existed have no scope list: try once, the API says if it's missing.
  if (meta?.scopes !== undefined && !hasAnalyticsScope(meta)) return { skipped: "Reconnect YouTube to allow analytics" };
  if (!options.force && state.lastAt && Date.now() - Date.parse(state.lastAt) < REFRESH_EVERY_MS) return { skipped: "fresh" };

  try {
    const token = await youtubeAccessToken(conn);
    const today = new Date();
    const end = day(today);

    const perVideo = await report(token, {
      startDate: "2005-04-23",
      endDate: end,
      metrics: "views,estimatedMinutesWatched,averageViewPercentage,subscribersGained,likes,comments",
      dimensions: "video",
      sort: "-views",
      maxResults: "200",
    });
    let updatedVideos = 0;
    const now = new Date();
    for (const r of perVideo) {
      const rows = await db
        .update(schema.videos)
        .set({
          views: int(r.views),
          watchMinutes: int(r.estimatedMinutesWatched),
          avgViewPercent: r.averageViewPercentage === undefined ? null : Math.round(Number(r.averageViewPercentage) * 10) / 10,
          subscribersGained: int(r.subscribersGained),
          likes: int(r.likes),
          commentsCount: int(r.comments),
          statsUpdatedAt: now,
        })
        .where(and(eq(schema.videos.platform, "YOUTUBE"), eq(schema.videos.externalId, String(r.video))))
        .returning({ id: schema.videos.id });
      updatedVideos += rows.length;
    }

    const start = new Date(today.getTime() - 34 * 86_400_000); // 28 days + analytics lag
    const daily = await report(token, {
      startDate: day(start),
      endDate: end,
      metrics: "views,estimatedMinutesWatched,subscribersGained,subscribersLost",
      dimensions: "day",
      sort: "day",
    });
    for (const r of daily) {
      const values = {
        views: int(r.views),
        watchMinutes: int(r.estimatedMinutesWatched),
        subscribersGained: int(r.subscribersGained),
        subscribersLost: int(r.subscribersLost),
        updatedAt: now,
      };
      await db
        .insert(schema.channelDaily)
        .values({ platform: "YOUTUBE", day: String(r.day), ...values })
        .onConflictDoUpdate({ target: [schema.channelDaily.platform, schema.channelDaily.day], set: values });
    }
    await saveState(conn, { lastAt: now.toISOString(), lastError: null });
    return { updatedVideos, days: daily.length };
  } catch (error) {
    const message = (error as Error).message;
    await saveState(conn, { lastError: message }).catch(() => undefined);
    return { error: message };
  }
}
