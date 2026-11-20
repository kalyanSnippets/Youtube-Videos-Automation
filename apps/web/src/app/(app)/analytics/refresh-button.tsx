"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { refreshAnalytics } from "@/lib/actions/analytics";

export function RefreshButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await refreshAnalytics();
            setMsg(r);
            router.refresh();
          })
        }
        className="rounded-lg border border-border px-3.5 py-2 text-sm hover:border-accent-cyan/40 disabled:opacity-50"
      >
        {pending ? "Refreshing…" : "Refresh now"}
      </button>
      {msg && <span className="text-xs text-text-dim">{msg}</span>}
    </div>
  );
}
