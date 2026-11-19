"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { kindLabel, type VideoRowData } from "./types";
import { VideoEditor } from "./video-editor";

type Filter = "all" | "needs" | "ready" | "yt-long" | "yt-short" | "ig-reel" | "ig-post" | "hidden";

const FILTERS: { id: Filter; label: string; test: (v: VideoRowData) => boolean }[] = [
  { id: "all", label: "All", test: (v) => !v.hidden },
  { id: "needs", label: "Needs a prompt", test: (v) => !v.hidden && !v.prompt },
  { id: "ready", label: "Prompt ready", test: (v) => !v.hidden && Boolean(v.prompt) },
  { id: "yt-long", label: "YouTube videos", test: (v) => !v.hidden && v.platform === "YOUTUBE" && v.format !== "SHORT" },
  { id: "yt-short", label: "Shorts", test: (v) => !v.hidden && v.platform === "YOUTUBE" && v.format === "SHORT" },
  { id: "ig-reel", label: "Reels", test: (v) => !v.hidden && v.platform === "INSTAGRAM" && v.format === "REEL" },
  { id: "ig-post", label: "Instagram posts", test: (v) => !v.hidden && v.platform === "INSTAGRAM" && v.format !== "REEL" },
  { id: "hidden", label: "Hidden", test: (v) => v.hidden },
];

function Status({ v }: { v: VideoRowData }) {
  if (v.hidden) return <span className="badge border bg-bg-raised text-text-dim border-border">Hidden</span>;
  if (v.prompt && v.keyword)
    return <span className="badge border bg-status-success/10 text-status-success border-status-success/30">✓ Prompt · {v.keyword}</span>;
  if (v.prompt) return <span className="badge border bg-status-success/10 text-status-success border-status-success/30">✓ Prompt (no keyword)</span>;
  if (v.keyword)
    return <span className="badge border bg-status-warning/10 text-status-warning border-status-warning/30">{v.keyword} · add the prompt</span>;
  return <span className="badge border bg-status-warning/10 text-status-warning border-status-warning/30">Needs a prompt</span>;
}

export function VideoList({ videos }: { videos: VideoRowData[] }) {
  const [filter, setFilter] = useState<Filter>(videos.some((v) => !v.prompt && !v.hidden) ? "needs" : "all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  // Videos you opened stay in view until you change the filter, even if saving moves them to another filter.
  const [pinned, setPinned] = useState<Set<string>>(new Set());
  const shown = useMemo(() => {
    const test = FILTERS.find((f) => f.id === filter)!.test;
    const term = q.trim().toLowerCase();
    return videos.filter((v) => (test(v) || pinned.has(v.id)) && (!term || `${v.title} ${v.keyword ?? ""} ${v.resourceTitle ?? ""}`.toLowerCase().includes(term)));
  }, [videos, filter, q, pinned]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="scroll-row -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {FILTERS.map((f) => {
          const n = videos.filter(f.test).length;
          if (f.id === "hidden" && !n) return null;
          return (
            <button
              key={f.id}
              onClick={() => {
                setFilter(f.id);
                setPinned(new Set());
              }}
              className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 sm:py-1.5 text-xs border transition ${
                filter === f.id ? "bg-accent-cyan/10 border-accent-cyan/40 text-accent-cyan" : "border-border text-text-dim hover:text-text"
              }`}
            >
              {f.label} <span className="opacity-70">{n}</span>
            </button>
          );
        })}
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search videos" className="sm:ml-auto w-full sm:w-48 rounded-lg bg-bg-raised border border-border px-3 py-2 sm:py-1.5 text-sm" />
      </div>

      <div className="panel divide-y divide-border-subtle overflow-hidden">
        {shown.map((v) => (
          <div key={v.id}>
            <div className="flex items-center gap-3 p-3 sm:p-4">
              <div className={`relative shrink-0 overflow-hidden rounded-md bg-bg-raised ${v.format === "SHORT" || v.format === "REEL" ? "h-16 w-9" : "h-12 w-20"}`}>
                <Image src={`/api/thumb/${v.id}`} alt="" fill sizes="80px" className="object-cover" unoptimized />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium line-clamp-2 sm:line-clamp-1">{v.resourceTitle || v.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-dim">
                  <span>{kindLabel(v)}</span>
                  {v.publishedAt && <span>· {new Date(v.publishedAt).toLocaleDateString()}</span>}
                  <Status v={v} />
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <a href={v.watchUrl} target="_blank" rel="noopener" className="hidden sm:inline text-xs text-text-dim hover:text-text">Watch ↗</a>
                <a href={`/v/${v.slug}`} target="_blank" className="hidden sm:inline text-xs text-text-dim hover:text-text">Page ↗</a>
                <button
                  onClick={() => {
                    setOpen(open === v.id ? null : v.id);
                    setPinned((prev) => new Set(prev).add(v.id));
                  }}
                  className={`whitespace-nowrap rounded-lg px-3 py-2 sm:px-3.5 sm:py-1.5 text-sm font-medium transition ${
                    open === v.id ? "border border-border text-text-dim" : v.prompt ? "border border-border hover:border-accent-cyan/40" : "bg-accent-cyan text-bg"
                  }`}
                >
                  {open === v.id ? "Close" : v.prompt ? "Edit prompt" : "Add prompt"}
                </button>
              </div>
            </div>
            {open === v.id && <VideoEditor video={v} onDone={() => setOpen(null)} />}
          </div>
        ))}
        {!shown.length && <p className="p-4 sm:p-6 text-center text-sm text-text-dim">Nothing here. Try another filter.</p>}
      </div>
    </div>
  );
}
