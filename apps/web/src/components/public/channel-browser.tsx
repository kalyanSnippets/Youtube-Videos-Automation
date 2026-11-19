"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { CardGrid, matches, type CardShape, type GridItem } from "./resource-grid";

export interface ChannelData {
  youtube: { long: GridItem[]; shorts: GridItem[] };
  instagram: { reels: GridItem[]; posts: GridItem[] };
  prompts: GridItem[];
}

type TabId = "youtube" | "instagram" | "prompts";
type SubId = "long" | "shorts" | "reels" | "posts";

const SUBS: Record<"youtube" | "instagram", { id: SubId; label: string; shape: CardShape }[]> = {
  youtube: [
    { id: "long", label: "Videos", shape: "video" },
    { id: "shorts", label: "Shorts", shape: "portrait" },
  ],
  instagram: [
    { id: "reels", label: "Reels", shape: "portrait" },
    { id: "posts", label: "Posts", shape: "square" },
  ],
};

export function ChannelBrowser({ data }: { data: ChannelData }) {
  const lists: Record<SubId, GridItem[]> = {
    long: data.youtube.long,
    shorts: data.youtube.shorts,
    reels: data.instagram.reels,
    posts: data.instagram.posts,
  };
  const firstNonEmpty = (["long", "shorts", "reels", "posts"] as SubId[]).find((s) => lists[s].length) ?? "long";
  const tabOf = (s: SubId): TabId => (s === "long" || s === "shorts" ? "youtube" : "instagram");

  const [tab, setTab] = useState<TabId>(data.youtube.long.length || data.youtube.shorts.length ? "youtube" : data.instagram.reels.length || data.instagram.posts.length ? "instagram" : "prompts");
  const [sub, setSub] = useState<SubId>(firstNonEmpty);
  const [q, setQ] = useState("");

  // Remember the section in the address (#youtube-shorts etc.) so links can point straight at it.
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    const [t, s] = hash.split("-") as [TabId, SubId | undefined];
    if (t === "prompts") setTab("prompts");
    if ((t === "youtube" || t === "instagram") && s && SUBS[t].some((x) => x.id === s)) {
      setTab(t);
      setSub(s);
    }
  }, []);
  const go = (t: TabId, s?: SubId) => {
    setTab(t);
    if (s) setSub(s);
    else if (t !== "prompts") setSub(SUBS[t].find((x) => lists[x.id].length)?.id ?? SUBS[t][0]!.id);
    history.replaceState(null, "", `#${t}${t === "prompts" ? "" : `-${s ?? ""}`}`.replace(/-$/, ""));
  };

  const term = q.trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (!term) return null;
    const groups: { label: string; items: GridItem[]; shape: CardShape }[] = [
      { label: "YouTube videos", items: data.youtube.long.filter((i) => matches(i, term)), shape: "video" },
      { label: "YouTube Shorts", items: data.youtube.shorts.filter((i) => matches(i, term)), shape: "portrait" },
      { label: "Instagram Reels", items: data.instagram.reels.filter((i) => matches(i, term)), shape: "portrait" },
      { label: "Instagram posts", items: data.instagram.posts.filter((i) => matches(i, term)), shape: "square" },
      { label: "Prompts", items: data.prompts.filter((i) => matches(i, term)), shape: "none" },
    ];
    return groups.filter((g) => g.items.length);
  }, [term, data]);

  const tabButton = (id: TabId, label: string, count?: string | null) => (
    <button
      key={id}
      onClick={() => go(id)}
      className={`rounded-xl px-4 py-2.5 text-sm font-medium border transition ${
        tab === id ? "bg-bg-raised border-accent-cyan/40 text-text" : "border-border text-text-dim hover:text-text"
      }`}
    >
      {label}
      {count && <span className="ml-2 text-xs font-normal text-text-faint">{count}</span>}
    </button>
  );

  const currentSubs = tab === "prompts" ? [] : SUBS[tab];
  const current = currentSubs.find((s) => s.id === sub) ?? currentSubs[0];

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search all videos, prompts or keywords"
          className="w-full rounded-xl bg-bg-panel border border-border pl-9 pr-3 py-3 text-sm focus:outline-none focus:border-accent-cyan/50"
        />
      </div>

      {searchResults ? (
        searchResults.length ? (
          searchResults.map((g) => (
            <section key={g.label} className="space-y-3">
              <h2 className="text-sm font-semibold text-text-dim uppercase tracking-wide">{g.label}</h2>
              <CardGrid items={g.items} shape={g.shape} />
            </section>
          ))
        ) : (
          <p className="text-center text-sm text-text-dim py-10">Nothing matches that search.</p>
        )
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {tabButton("youtube", "YouTube")}
            {tabButton("instagram", "Instagram")}
            {data.prompts.length > 0 && tabButton("prompts", "Prompts", String(data.prompts.length))}
          </div>

          {tab !== "prompts" && (
            <div className="flex flex-wrap items-center gap-2">
              {currentSubs.map((s) => (
                <button
                  key={s.id}
                  onClick={() => go(tabOf(s.id), s.id)}
                  className={`rounded-full px-3.5 py-1.5 text-xs border transition ${
                    current?.id === s.id ? "bg-accent-cyan/10 border-accent-cyan/40 text-accent-cyan" : "border-border text-text-dim hover:text-text"
                  }`}
                >
                  {s.label} <span className="opacity-70">{lists[s.id].length}</span>
                </button>
              ))}

            </div>
          )}

          {tab === "prompts" ? (
            <CardGrid items={data.prompts} shape="none" />
          ) : current && lists[current.id].length ? (
            <CardGrid items={lists[current.id]} shape={current.shape} />
          ) : (
            <p className="text-center text-sm text-text-dim py-10">Nothing here yet.</p>
          )}
        </>
      )}
    </div>
  );
}
