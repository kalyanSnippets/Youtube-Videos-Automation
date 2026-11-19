"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

export interface GridItem {
  href: string;
  title: string;
  summary: string | null;
  keywords: string[];
  thumbnail?: string | null;
  /** Small label, e.g. "YouTube", "Instagram" or "Prompt coming soon". */
  badge?: string;
  badgeTone?: "cyan" | "purple" | "dim";
  /** Extra search text, e.g. the date. */
  meta?: string;
}

const TONE = {
  cyan: "bg-accent-cyan/10 text-accent-cyan border-accent-cyan/30",
  purple: "bg-accent-purple/10 text-accent-purple border-accent-purple/30",
  dim: "bg-bg-raised text-text-dim border-border",
} as const;

export function ResourceGrid({ items, emptyText = "New prompts are coming soon." }: { items: GridItem[]; emptyText?: string }) {
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter((r) => [r.title, r.summary ?? "", r.meta ?? "", ...r.keywords].join(" ").toLowerCase().includes(term));
  }, [q, items]);

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search videos, prompts or keywords"
          className="w-full rounded-xl bg-bg-panel border border-border pl-9 pr-3 py-3 text-sm focus:outline-none focus:border-accent-cyan/50"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((r) => (
          <Link key={r.href} href={r.href} className="panel overflow-hidden flex flex-col hover:border-accent-cyan/40 hover:shadow-glow transition">
            {r.thumbnail && (
              <div className="relative aspect-video bg-bg-raised">
                <Image src={r.thumbnail} alt="" fill sizes="(min-width: 1024px) 320px, 50vw" className="object-cover" unoptimized />
              </div>
            )}
            <div className="p-5 flex flex-col gap-3 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {r.badge && <span className={`badge border ${TONE[r.badgeTone ?? "dim"]}`}>{r.badge}</span>}
                {r.meta && <span className="text-xs text-text-faint">{r.meta}</span>}
              </div>
              <h2 className="font-semibold leading-snug">{r.title}</h2>
              {r.summary && <p className="text-sm text-text-dim line-clamp-3">{r.summary}</p>}
              {r.keywords.length > 0 && (
                <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
                  {r.keywords.slice(0, 3).map((k) => (
                    <span key={k} className="badge border bg-accent-cyan/10 text-accent-cyan border-accent-cyan/30">{k}</span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
      {!shown.length && <p className="text-center text-sm text-text-dim py-10">{items.length ? "Nothing matches that search." : emptyText}</p>}
    </div>
  );
}
