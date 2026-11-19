import { desc } from "drizzle-orm";
import { db, schema } from "@yaos/database";
import { listConnections } from "@yaos/comment-bot";
import { SyncButton } from "./sync-button";
import { VideoCard, type VideoCardData } from "./video-card";

export const dynamic = "force-dynamic";

export default async function VideosPage() {
  const [rows, connections, migrated] = await Promise.all([
    db.select().from(schema.videos).orderBy(desc(schema.videos.publishedAt)).catch(() => null),
    listConnections().catch(() => []),
    Promise.resolve(true),
  ]);
  const cards: VideoCardData[] = (rows ?? []).map((v) => ({
    id: v.id,
    platform: v.platform,
    title: v.title,
    watchUrl: v.watchUrl,
    thumbnailUrl: v.thumbnailUrl,
    publishedAt: v.publishedAt ? v.publishedAt.toISOString() : null,
    keyword: v.keyword,
    hasPrompt: Boolean(v.prompt),
    promptSource: v.promptSource,
    promptFilename: v.promptFilename,
    promptPreview: v.prompt ? v.prompt.slice(0, 300) : null,
    hidden: v.hidden,
    slug: v.slug,
  }));
  const needs = cards.filter((c) => !c.hasPrompt && !c.hidden).length;
  const lastSync = connections
    .map((c) => (c.metadata as { sync?: { lastSyncAt?: string; lastError?: string | null } } | null)?.sync)
    .filter((s): s is { lastSyncAt?: string; lastError?: string | null } => Boolean(s?.lastSyncAt))
    .sort((a, b) => (b.lastSyncAt ?? "").localeCompare(a.lastSyncAt ?? ""))[0];

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex-1 min-w-[240px]">
          <h1 className="text-xl font-semibold mb-1">Videos</h1>
          <p className="text-sm text-text-dim">
            Every YouTube video and Instagram post is added here automatically, refreshed every hour. Add the keyword and upload the prompt; cards with a prompt appear on your public site.
          </p>
        </div>
        <a href="/" target="_blank" className="rounded-lg border border-border px-3.5 py-2 text-sm text-text-dim hover:text-text">View site ↗</a>
      </div>

      <div className="panel p-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm">
          <span className="font-semibold">{cards.length}</span> videos · <span className="font-semibold">{needs}</span> need a prompt
          {lastSync?.lastSyncAt && (
            <span className="text-text-dim"> · last synced {new Date(lastSync.lastSyncAt).toLocaleString()}</span>
          )}
        </p>
        <SyncButton />
      </div>
      {lastSync?.lastError && <p className="text-sm text-status-danger">Last sync error: {lastSync.lastError}</p>}

      {rows === null && (
        <p className="panel p-4 text-sm text-status-warning">
          The videos table isn't in the database yet. Run docs/supabase-videos-migration.sql in Supabase, then refresh this page.
        </p>
      )}

      <div className="space-y-4">
        {cards.map((c) => (
          <VideoCard key={c.id} video={c} />
        ))}
        {rows !== null && cards.length === 0 && (
          <p className="panel p-6 text-center text-sm text-text-dim">
            No videos yet. Connect YouTube or Instagram on the Comment Bot page, then click Sync now.
          </p>
        )}
      </div>
    </div>
  );
}
