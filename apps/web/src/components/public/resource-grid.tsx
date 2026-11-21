"use client";

import Link from "next/link";
import Image from "next/image";

export interface GridItem {
  href: string;
  title: string;
  summary: string | null;
  keywords: string[];
  thumbnail?: string | null;
  /** Small label, e.g. "Free prompt". */
  badge?: string;
  badgeTone?: "cyan" | "purple" | "dim";
  /** Extra text shown next to the badge and included in search, e.g. the date. */
  meta?: string;
}

export type CardShape = "video" | "portrait" | "square" | "none";

const TONE = {
  cyan: "bg-accent-cyan/10 text-accent-cyan border-accent-cyan/30",
  purple: "bg-accent-purple/10 text-accent-purple border-accent-purple/30",
  dim: "bg-bg-raised text-text-dim border-border",
} as const;

const ASPECT: Record<CardShape, string> = { video: "aspect-video", portrait: "aspect-[9/16]", square: "aspect-square", none: "" };
const COLUMNS: Record<CardShape, string> = {
  video: "sm:grid-cols-2 lg:grid-cols-3",
  portrait: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  square: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  none: "sm:grid-cols-2 lg:grid-cols-3",
};

export function matches(item: GridItem, term: string): boolean {
  return [item.title, item.summary ?? "", item.meta ?? "", ...item.keywords].join(" ").toLowerCase().includes(term);
}

export function CardGrid({ items, shape = "video" }: { items: GridItem[]; shape?: CardShape }) {
  const compact = shape === "portrait" || shape === "square";
  return (
    <div className={`grid gap-4 ${COLUMNS[shape]}`}>
      {items.map((r) => (
        <Link key={r.href} href={r.href} className="panel overflow-hidden flex flex-col hover:border-accent-cyan/40 hover:shadow-glow transition">
          {r.thumbnail && shape !== "none" && (
            <div className={`relative ${ASPECT[shape]} bg-bg-raised`}>
              <Image src={r.thumbnail} alt="" fill sizes="(min-width: 1024px) 320px, 50vw" className="object-cover" unoptimized />
            </div>
          )}
          <div className={`${compact ? "p-3 gap-2" : "p-5 gap-3"} flex flex-col flex-1`}>
            {(r.badge || r.meta) && (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                {r.badge && <span className={`badge border ${TONE[r.badgeTone ?? "dim"]}`}>{r.badge}</span>}
                {r.meta && <span className="text-xs text-text-faint tabular-nums">{r.meta}</span>}
              </div>
            )}
            <h2 className={`font-semibold leading-snug ${compact ? "text-sm line-clamp-3" : ""}`}>{r.title}</h2>
            {r.summary && <p className={`text-text-dim ${compact ? "text-xs line-clamp-2" : "text-sm line-clamp-3"}`}>{r.summary}</p>}
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
  );
}
