"use client";

import { useMemo, useState } from "react";
import { VideoCard, type VideoCardData } from "./video-card";

type Filter = "all" | "yt-long" | "yt-short" | "ig-reel" | "ig-post" | "needs";

const FILTERS: { id: Filter; label: string; test: (v: VideoCardData) => boolean }[] = [
  { id: "all", label: "All", test: () => true },
  { id: "yt-long", label: "YouTube videos", test: (v) => v.platform === "YOUTUBE" && v.format !== "SHORT" },
  { id: "yt-short", label: "YouTube Shorts", test: (v) => v.platform === "YOUTUBE" && v.format === "SHORT" },
  { id: "ig-reel", label: "Instagram Reels", test: (v) => v.platform === "INSTAGRAM" && v.format === "REEL" },
  { id: "ig-post", label: "Instagram posts", test: (v) => v.platform === "INSTAGRAM" && v.format !== "REEL" },
  { id: "needs", label: "Needs prompt", test: (v) => !v.hasPrompt && !v.hidden },
];

export function VideoList({ cards }: { cards: VideoCardData[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const test = FILTERS.find((f) => f.id === filter)!.test;
    const term = q.trim().toLowerCase();
    return cards.filter((c) => test(c) && (!term || `${c.title} ${c.keyword ?? ""}`.toLowerCase().includes(term)));
  }, [cards, filter, q]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-3.5 py-1.5 text-xs border transition ${
              filter === f.id ? "bg-accent-cyan/10 border-accent-cyan/40 text-accent-cyan" : "border-border text-text-dim hover:text-text"
            }`}
          >
            {f.label} <span className="opacity-70">{cards.filter(f.test).length}</span>
          </button>
        ))}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search titles or keywords"
          className="ml-auto w-full sm:w-56 rounded-lg bg-bg-raised border border-border px-3 py-1.5 text-sm"
        />
      </div>
      {shown.map((c) => (
        <VideoCard key={c.id} video={c} />
      ))}
      {!shown.length && <p className="panel p-6 text-center text-sm text-text-dim">Nothing in this section.</p>}
    </div>
  );
}
