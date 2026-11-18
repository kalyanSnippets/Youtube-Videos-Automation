"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

export interface ResourceCard {
  slug: string;
  title: string;
  summary: string | null;
  keywords: string[];
}

export function ResourceGrid({ resources }: { resources: ResourceCard[] }) {
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return resources;
    return resources.filter((r) => [r.title, r.summary ?? "", ...r.keywords].join(" ").toLowerCase().includes(term));
  }, [q, resources]);

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search prompts or keywords"
          className="w-full rounded-xl bg-bg-panel border border-border pl-9 pr-3 py-3 text-sm focus:outline-none focus:border-accent-cyan/50"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((r) => (
          <Link key={r.slug} href={`/r/${r.slug}`} className="panel p-5 flex flex-col gap-3 hover:border-accent-cyan/40 hover:shadow-glow transition">
            <h2 className="font-semibold leading-snug">{r.title}</h2>
            {r.summary && <p className="text-sm text-text-dim line-clamp-3">{r.summary}</p>}
            {r.keywords.length > 0 && (
              <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
                {r.keywords.slice(0, 3).map((k) => (
                  <span key={k} className="badge border bg-accent-cyan/10 text-accent-cyan border-accent-cyan/30">{k}</span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>
      {!shown.length && (
        <p className="text-center text-sm text-text-dim py-10">{resources.length ? "Nothing matches that search." : "New prompts are coming soon."}</p>
      )}
    </div>
  );
}
