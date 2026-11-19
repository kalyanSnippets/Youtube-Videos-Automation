"use client";

import { useState, useTransition } from "react";
import { syncVideosNow } from "@/lib/actions/videos";
import type { SyncReport } from "@/lib/video-sync";

function describe(r: SyncReport["youtube"]): string {
  if (!r) return "";
  if ("skipped" in r) return `skipped (${r.skipped})`;
  if ("error" in r) return `error: ${r.error}`;
  return `${r.created} new, ${r.updated} refreshed${r.more ? " (more to come next hour)" : ""}`;
}

export function SyncButton() {
  const [pending, start] = useTransition();
  const [report, setReport] = useState<SyncReport | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        disabled={pending}
        onClick={() => start(async () => setReport(await syncVideosNow()))}
        className="rounded-lg border border-border px-3.5 py-2 text-sm hover:border-accent-cyan/40 disabled:opacity-50"
      >
        {pending ? "Checking…" : "Check now"}
      </button>
      {report && (
        <p className="text-xs text-text-dim">
          YouTube: {describe(report.youtube)} · Instagram: {describe(report.instagram)}
          {report.stats?.youtube && "subscribers" in report.stats.youtube && report.stats.youtube.subscribers !== null && ` · ${report.stats.youtube.subscribers.toLocaleString()} subscribers`}
          {report.stats?.instagram && "followers" in report.stats.instagram && report.stats.instagram.followers !== null && ` · ${report.stats.instagram.followers.toLocaleString()} followers`}
        </p>
      )}
    </div>
  );
}
