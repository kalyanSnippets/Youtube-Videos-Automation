import { asc, desc, eq } from "drizzle-orm";
import { db, ensureSchemaPatches, schema } from "@yaos/database";
import { getConnection, hasAnalyticsScope } from "@yaos/comment-bot";
import { BarChart, type BarPoint } from "@/components/admin/bar-chart";
import { analyticsState } from "@/lib/youtube-analytics";
import { cleanTitle } from "@/lib/video-match";
import { kindLabel } from "../videos/types";
import { RefreshButton } from "./refresh-button";
import { VideoTable, type VideoStatRow } from "./video-table";

export const dynamic = "force-dynamic";

const fmt = new Intl.NumberFormat("en");

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="panel p-4 min-w-[150px] flex-1">
      <p className="text-xs text-text-dim">{label}</p>
      <p className="text-2xl font-semibold mt-0.5 tabular-nums">{value}</p>
      {hint && <p className="text-xs text-text-dim">{hint}</p>}
    </div>
  );
}

export default async function AnalyticsPage() {
  await ensureSchemaPatches();
  const [conn, dailyRows, videos, resources] = await Promise.all([
    getConnection("YOUTUBE").catch(() => null),
    db.select().from(schema.channelDaily).where(eq(schema.channelDaily.platform, "YOUTUBE")).orderBy(desc(schema.channelDaily.day)).limit(28).catch(() => []),
    db.select().from(schema.videos).where(eq(schema.videos.hidden, false)).orderBy(asc(schema.videos.publishedAt)).catch(() => []),
    db.select({ views: schema.resources.views }).from(schema.resources).catch(() => []),
  ]);
  const state = analyticsState(conn);
  const meta = conn?.metadata as { scopes?: string } | null;
  const needsReconnect = Boolean(conn) && ((meta?.scopes !== undefined && !hasAnalyticsScope(meta)) || /reconnect/i.test(state.lastError ?? ""));
  const daily = [...dailyRows].reverse();
  const views: BarPoint[] = daily.map((d) => ({ day: String(d.day), value: d.views ?? 0 }));
  const subs: BarPoint[] = daily.map((d) => ({ day: String(d.day), value: (d.subscribersGained ?? 0) - (d.subscribersLost ?? 0) }));
  const sum = (k: "views" | "watchMinutes" | "subscribersGained" | "subscribersLost") => daily.reduce((s, d) => s + (d[k] ?? 0), 0);
  const siteVisits = videos.reduce((s, v) => s + (v.pageViews ?? 0), 0) + resources.reduce((s, r) => s + (r.views ?? 0), 0);
  const rows: VideoStatRow[] = videos
    .filter((v) => v.platform === "YOUTUBE" || v.pageViews > 0)
    .map((v) => ({
      id: v.id,
      title: cleanTitle(v.title) || v.title,
      kind: kindLabel(v),
      slug: v.slug,
      watchUrl: v.watchUrl,
      views: v.views,
      watchMinutes: v.watchMinutes,
      avgViewPercent: v.avgViewPercent,
      subscribersGained: v.subscribersGained,
      likes: v.likes,
      comments: v.commentsCount,
      siteVisits: v.pageViews,
      keyword: v.keyword,
      hasPrompt: Boolean(v.prompt),
    }));

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl">
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex-1 min-w-[240px]">
          <h1 className="text-xl font-semibold mb-1">Analytics</h1>
          <p className="text-sm text-text-dim">
            Your YouTube numbers from YouTube Analytics, plus how many people opened each prompt page on your site. YouTube&apos;s numbers run a day or two
            behind YouTube Studio and refresh every 6 hours.
          </p>
        </div>
        {conn && !needsReconnect && <RefreshButton />}
      </div>

      {!conn && (
        <div className="panel p-5 text-sm">
          YouTube isn&apos;t connected. Connect it on <a className="text-accent-cyan" href="/comment-bot/setup">Comment Bot → Setup</a>.
        </div>
      )}

      {needsReconnect && (
        <div className="panel p-5 space-y-3 border-status-warning/40">
          <p className="font-semibold">One step to turn on analytics</p>
          <ol className="list-decimal pl-5 space-y-1.5 text-sm text-text-dim">
            <li>
              In <b className="text-text">Google Cloud</b> (project AI with Kalyan): <b className="text-text">APIs &amp; Services → Library</b>, search
              &ldquo;YouTube Analytics API&rdquo; and click <b className="text-text">Enable</b>.
            </li>
            <li>
              <b className="text-text">Google Auth Platform → Data access → Add or remove scopes</b>: tick <code>yt-analytics.readonly</code>, then Update and Save.
            </li>
            <li>
              Click <b className="text-text">Reconnect YouTube</b> below and allow the new permission (&ldquo;View YouTube Analytics reports&rdquo;).
            </li>
          </ol>
          <a href="/api/comment-bot/youtube/connect" className="inline-block rounded-lg bg-accent-cyan text-bg font-medium text-sm px-4 py-2">
            Reconnect YouTube
          </a>
        </div>
      )}

      {state.lastError && !needsReconnect && <p className="text-sm text-status-danger">Last refresh failed: {state.lastError}</p>}
      {conn && !needsReconnect && !state.lastAt && !state.lastError && (
        <p className="panel p-4 text-sm text-text-dim">No numbers yet. Click Refresh now, or wait for the next hourly check.</p>
      )}

      <div className="flex flex-wrap gap-3">
        <Tile label="Views, last 28 days" value={daily.length ? fmt.format(sum("views")) : "—"} />
        <Tile label="Watch time, last 28 days" value={daily.length ? `${fmt.format(Math.round(sum("watchMinutes") / 60))} h` : "—"} />
        <Tile
          label="Subscribers, last 28 days"
          value={daily.length ? `${sum("subscribersGained") - sum("subscribersLost") >= 0 ? "+" : ""}${fmt.format(sum("subscribersGained") - sum("subscribersLost"))}` : "—"}
          hint={daily.length ? `${fmt.format(sum("subscribersGained"))} gained · ${fmt.format(sum("subscribersLost"))} lost` : undefined}
        />
        <Tile label="Prompt page visits" value={fmt.format(siteVisits)} hint="on aiwithkalyan.com, all time" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BarChart title="Views per day" unit="views" data={views} />
        <BarChart title="Subscribers per day (gained minus lost)" unit="subscribers" data={subs} />
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="font-semibold">Videos</h2>
          <p className="text-xs text-text-dim">Lifetime totals. Click a column to sort. &ldquo;Site visits&rdquo; counts people who opened the prompt page.</p>
        </div>
        {rows.length ? <VideoTable rows={rows} /> : <p className="panel p-6 text-center text-sm text-text-dim">No videos yet.</p>}
      </section>
      {state.lastAt && <p className="text-xs text-text-faint">Last updated {new Date(state.lastAt).toLocaleString()}</p>}
    </div>
  );
}
