"use client";

import { useMemo, useState } from "react";

export interface VideoStatRow {
  id: string;
  title: string;
  kind: string;
  slug: string;
  watchUrl: string;
  views: number | null;
  watchMinutes: number | null;
  avgViewPercent: number | null;
  subscribersGained: number | null;
  likes: number | null;
  comments: number | null;
  siteVisits: number;
  keyword: string | null;
  hasPrompt: boolean;
}

type Key = "views" | "watchMinutes" | "avgViewPercent" | "subscribersGained" | "likes" | "comments" | "siteVisits";

const fmt = new Intl.NumberFormat("en");
const COLS: { key: Key; label: string; render: (r: VideoStatRow) => string }[] = [
  { key: "views", label: "Views", render: (r) => (r.views === null ? "—" : fmt.format(r.views)) },
  { key: "watchMinutes", label: "Watch time", render: (r) => (r.watchMinutes === null ? "—" : `${fmt.format(Math.round(r.watchMinutes / 6) / 10)} h`) },
  { key: "avgViewPercent", label: "Avg watched", render: (r) => (r.avgViewPercent === null ? "—" : `${Math.round(r.avgViewPercent)}%`) },
  { key: "subscribersGained", label: "Subs gained", render: (r) => (r.subscribersGained === null ? "—" : `+${fmt.format(r.subscribersGained)}`) },
  { key: "likes", label: "Likes", render: (r) => (r.likes === null ? "—" : fmt.format(r.likes)) },
  { key: "comments", label: "Comments", render: (r) => (r.comments === null ? "—" : fmt.format(r.comments)) },
  { key: "siteVisits", label: "Site visits", render: (r) => fmt.format(r.siteVisits) },
];

export function VideoTable({ rows }: { rows: VideoStatRow[] }) {
  const [sort, setSort] = useState<Key>("views");
  const sorted = useMemo(() => [...rows].sort((a, b) => (b[sort] ?? -1) - (a[sort] ?? -1)), [rows, sort]);
  return (
    <div className="panel overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="text-left text-xs text-text-dim border-b border-border-subtle">
            <th className="p-3 font-medium">Video</th>
            {COLS.map((c) => (
              <th key={c.key} className="p-3 font-medium text-right">
                <button onClick={() => setSort(c.key)} className={sort === c.key ? "text-accent-cyan" : "hover:text-text"}>
                  {c.label}
                  {sort === c.key ? " ↓" : ""}
                </button>
              </th>
            ))}
            <th className="p-3 font-medium">Prompt</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {sorted.map((r) => (
            <tr key={r.id}>
              <td className="p-3 max-w-[260px]">
                <a href={r.watchUrl} target="_blank" rel="noopener" className="line-clamp-2 hover:text-accent-cyan">
                  {r.title}
                </a>
                <span className="text-xs text-text-dim">{r.kind}</span>
              </td>
              {COLS.map((c) => (
                <td key={c.key} className="p-3 text-right tabular-nums text-text-dim">
                  {c.render(r)}
                </td>
              ))}
              <td className="p-3 text-xs">
                {r.hasPrompt ? (
                  <a href={`/v/${r.slug}`} target="_blank" className="text-status-success hover:underline">
                    ✓ {r.keyword ?? "page"}
                  </a>
                ) : (
                  <span className="text-text-faint">none</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
