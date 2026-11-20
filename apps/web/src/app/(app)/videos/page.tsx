import { desc, eq } from "drizzle-orm";
import { db, ensureSchemaPatches, schema } from "@yaos/database";
import { listConnections } from "@yaos/comment-bot";
import { latestStats, type PlatformStats } from "@/lib/channel-stats";
import { moveResourceToVideo } from "@/lib/actions/videos";
import { cleanTitle, findTwin } from "@/lib/video-match";
import { inputClass } from "@/components/form-fields";
import { SyncButton } from "./sync-button";
import { kindLabel, type VideoRowData } from "./types";
import { VideoList } from "./video-list";

export const dynamic = "force-dynamic";

const fmt = new Intl.NumberFormat("en");

function StatTile({ label, unit, stats }: { label: string; unit: string; stats: PlatformStats | null }) {
  const change = stats?.followersChange7d;
  return (
    <div className="panel p-4 min-w-[160px] flex-1">
      <p className="text-xs text-text-dim">{label}</p>
      <p className="text-2xl font-semibold mt-0.5">{stats?.followers !== null && stats?.followers !== undefined ? fmt.format(stats.followers) : "—"}</p>
      <p className="text-xs text-text-dim">
        {unit}
        {change !== null && change !== undefined && (
          <span className={change >= 0 ? "text-status-success" : "text-status-danger"}>
            {" "}
            · {change >= 0 ? "+" : ""}
            {fmt.format(change)} this week
          </span>
        )}
      </p>
    </div>
  );
}

export default async function VideosPage() {
  await ensureSchemaPatches();
  const [rows, connections, stats, oldResources] = await Promise.all([
    db.select().from(schema.videos).orderBy(desc(schema.videos.publishedAt)).catch(() => null),
    listConnections().catch(() => []),
    latestStats(),
    db.select().from(schema.resources).where(eq(schema.resources.published, true)).catch(() => []),
  ]);
  const all = rows ?? [];
  const videos: VideoRowData[] = all.map((v) => {
    const twin = findTwin(v, all);
    return {
      id: v.id,
      platform: v.platform,
      format: v.format,
      title: v.title,
      watchUrl: v.watchUrl,
      publishedAt: v.publishedAt ? v.publishedAt.toISOString() : null,
      slug: v.slug,
      hidden: v.hidden,
      keyword: v.keyword,
      resourceTitle: v.resourceTitle,
      prompt: v.prompt,
      promptSource: v.promptSource,
      promptFilename: v.promptFilename,
      extraLink: v.extraLink,
      stats: { views: v.views, avgViewPercent: v.avgViewPercent, subscribersGained: v.subscribersGained, pageViews: v.pageViews ?? 0 },
      twin: twin ? { id: twin.id, label: `${kindLabel(twin)} “${(cleanTitle(twin.title) || twin.title).slice(0, 60)}”`, hasPrompt: Boolean(twin.prompt) } : null,
    };
  });
  const needs = videos.filter((v) => !v.prompt && !v.hidden).length;
  const lastSync = connections
    .map((c) => (c.metadata as { sync?: { lastSyncAt?: string; lastError?: string | null } } | null)?.sync)
    .filter((s): s is { lastSyncAt?: string; lastError?: string | null } => Boolean(s?.lastSyncAt))
    .sort((a, b) => (b.lastSyncAt ?? "").localeCompare(a.lastSyncAt ?? ""))[0];
  const pickable = videos.filter((v) => !v.hidden);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex-1 min-w-[240px]">
          <h1 className="text-xl font-semibold mb-1">Videos & prompts</h1>
          <p className="text-sm text-text-dim">
            Every new YouTube video and Instagram post appears here by itself. Add a prompt and a keyword to a video, and it shows on your website and the
            comment bot sends it to anyone who comments the keyword.
          </p>
        </div>
        <a href="/" target="_blank" className="hidden sm:inline-block rounded-lg border border-border px-3.5 py-2 text-sm text-text-dim hover:text-text">View website ↗</a>
      </div>

      <div className="flex flex-wrap gap-3">
        <StatTile label="YouTube" unit="subscribers" stats={stats.youtube} />
        <StatTile label="Instagram" unit="followers" stats={stats.instagram} />
        <div className="panel p-4 min-w-[160px] flex-1">
          <p className="text-xs text-text-dim">Videos</p>
          <p className="text-2xl font-semibold mt-0.5">{videos.filter((v) => !v.hidden).length}</p>
          <p className="text-xs text-text-dim">{needs ? <span className="text-status-warning">{needs} need a prompt</span> : "all have prompts 🎉"}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-text-dim">
          Checks for new videos every hour
          {lastSync?.lastSyncAt && <> · last checked {new Date(lastSync.lastSyncAt).toLocaleString()}</>}
        </p>
        <SyncButton />
      </div>
      {lastSync?.lastError && <p className="text-sm text-status-danger">Last check failed: {lastSync.lastError}</p>}

      {rows === null && (
        <p className="panel p-4 text-sm text-status-warning">
          The videos table isn't in the database yet. Run docs/supabase-videos-migration.sql in Supabase, then refresh this page.
        </p>
      )}

      {oldResources.length > 0 && pickable.length > 0 && (
        <section className="panel p-5 space-y-3 border-accent-purple/30">
          <div>
            <h2 className="font-semibold">Move your old prompts onto videos</h2>
            <p className="text-sm text-text-dim">
              Prompts now live on each video. Pick the video each old prompt belongs to; it&apos;s copied over (with its keyword) and the old copy is removed.
            </p>
          </div>
          {oldResources.map((r) => (
            <form key={r.id} action={moveResourceToVideo} className="flex flex-col gap-2 rounded-lg bg-bg-raised/50 p-3 sm:flex-row sm:flex-wrap sm:items-center">
              <input type="hidden" name="resourceId" value={r.id} />
              <span className="min-w-[180px] flex-1 text-sm">
                <span className="font-medium">{r.title}</span>
                {r.keywords?.length ? <span className="ml-2 text-xs text-accent-cyan">{r.keywords.join(", ")}</span> : null}
              </span>
              <select name="videoId" defaultValue="" className={`${inputClass} w-full sm:w-auto sm:max-w-[280px] py-1.5 text-xs`}>
                <option value="">YouTube video…</option>
                {pickable.filter((v) => v.platform === "YOUTUBE").map((v) => (
                  <option key={v.id} value={v.id}>{(cleanTitle(v.title) || v.title).slice(0, 60)}</option>
                ))}
              </select>
              <select name="videoId" defaultValue="" className={`${inputClass} w-full sm:w-auto sm:max-w-[280px] py-1.5 text-xs`}>
                <option value="">Instagram post… (optional)</option>
                {pickable.filter((v) => v.platform === "INSTAGRAM").map((v) => (
                  <option key={v.id} value={v.id}>{(cleanTitle(v.title) || v.title).slice(0, 60)}</option>
                ))}
              </select>
              <button className="rounded-lg bg-accent-purple text-white text-xs font-medium px-3.5 py-2">Move</button>
            </form>
          ))}
        </section>
      )}

      {rows !== null && videos.length === 0 ? (
        <p className="panel p-6 text-center text-sm text-text-dim">
          No videos yet. Connect YouTube or Instagram (Comment Bot → Setup), then click Check now.
        </p>
      ) : (
        <VideoList videos={videos} />
      )}
    </div>
  );
}
