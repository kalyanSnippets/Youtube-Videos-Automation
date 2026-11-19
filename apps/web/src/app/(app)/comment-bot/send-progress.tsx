"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { processCommentNow } from "@/lib/actions/comment-bot";
import type { ProcessNowResult } from "@yaos/comment-bot";

export interface PendingComment {
  id: string;
  platform: string;
  author: string | null;
  text: string;
  status: string;
}

type ItemState = "waiting" | "sending" | "replied" | "skipped" | "failed";

function stateOf(r: ProcessNowResult): ItemState {
  if (r.outcome === "REPLIED" || r.outcome === "DRY_RUN" || r.status === "REPLIED") return "replied";
  if (r.outcome === "SKIPPED") return "skipped";
  return "failed";
}

function explain(r: ProcessNowResult): string {
  switch (r.outcome) {
    case "REPLIED":
      return "Reply sent";
    case "DRY_RUN":
      return "Dry run: reply planned, nothing posted";
    case "SKIPPED":
      return `Skipped: ${r.skipReason ?? "nothing to reply"}`;
    case "ALREADY_HANDLED":
      return r.status === "REPLIED" ? "Already replied" : "Being handled by another run";
    case "NOT_CONNECTED":
      return "That platform isn't connected";
    case "PAUSED":
      return "The bot is paused (COMMENT_BOT_PAUSED)";
    case "NOT_FOUND":
      return "Comment not found";
    default:
      return r.error ?? "Failed";
  }
}

const DOT: Record<ItemState, string> = {
  waiting: "bg-text-faint",
  sending: "bg-accent-cyan animate-pulse",
  replied: "bg-status-success",
  skipped: "bg-status-warning",
  failed: "bg-status-danger",
};

/** Sends replies one comment at a time and shows a live progress bar with each result. */
export function SendProgress({ items: liveItems, label }: { items: PendingComment[]; label: string }) {
  const router = useRouter();
  // The page refreshes after a run (and the failed list changes), so keep the list this run was started with.
  const [runItems, setRunItems] = useState<PendingComment[] | null>(null);
  const items = runItems ?? liveItems;
  const [states, setStates] = useState<Record<string, { state: ItemState; note?: string }>>({});
  const [running, setRunning] = useState(false);
  const done = Object.values(states).filter((s) => s.state !== "waiting" && s.state !== "sending").length;
  const started = Object.keys(states).length > 0;
  const total = items.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const tally = (s: ItemState) => Object.values(states).filter((x) => x.state === s).length;

  async function run() {
    const batch = running ? items : liveItems.length ? liveItems : items;
    setRunItems(batch);
    setRunning(true);
    setStates(Object.fromEntries(batch.map((i) => [i.id, { state: "waiting" as ItemState }])));
    for (const item of batch) {
      setStates((prev) => ({ ...prev, [item.id]: { state: "sending" } }));
      const result = await processCommentNow(item.id).catch((e: Error) => ({ outcome: "FAILED", error: e.message }) as ProcessNowResult);
      setStates((prev) => ({ ...prev, [item.id]: { state: stateOf(result), note: explain(result) } }));
    }
    setRunning(false);
    router.refresh();
  }

  if (!total) return null;
  return (
    <section className="panel p-5 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={run}
          disabled={running}
          className="rounded-lg bg-accent-cyan text-bg font-medium text-sm px-4 py-2 disabled:opacity-50"
        >
          {running ? "Sending…" : started ? "Run again" : label}
        </button>
        <span className="text-sm text-text-dim">
          {started ? `${done} of ${total} done · ${tally("replied")} sent · ${tally("skipped")} skipped · ${tally("failed")} failed` : `${total} comment${total === 1 ? "" : "s"} waiting`}
        </span>
      </div>
      {started && (
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-bg-raised" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-gradient-to-r from-accent-cyan to-accent-purple transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      )}
      <ul className="space-y-1.5 text-sm">
        {items.map((item) => {
          const s = states[item.id];
          return (
            <li key={item.id} className="flex items-start gap-2.5">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT[s?.state ?? "waiting"]}`} />
              <span className="min-w-0">
                <span className="text-text-dim">{item.platform === "YOUTUBE" ? "YouTube" : "Instagram"} · {item.author ?? "viewer"}: </span>
                <span className="line-clamp-1 inline">{item.text}</span>
                {s?.note && <span className={`block text-xs ${s.state === "failed" ? "text-status-danger" : s.state === "skipped" ? "text-status-warning" : "text-status-success"}`}>{s.note}</span>}
                {s?.state === "sending" && <span className="block text-xs text-accent-cyan">Sending…</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** One-comment version for the table rows: "Retry" on failed, "Send reply" on skipped. */
export function RowSend({ item }: { item: PendingComment }) {
  const router = useRouter();
  const [state, setState] = useState<{ state: ItemState; note?: string } | null>(null);
  const label = item.status === "FAILED" ? "Retry" : "Send reply";
  return (
    <div className="mt-2 space-y-1">
      <button
        disabled={state?.state === "sending"}
        onClick={async () => {
          setState({ state: "sending" });
          const r = await processCommentNow(item.id).catch((e: Error) => ({ outcome: "FAILED", error: e.message }) as ProcessNowResult);
          setState({ state: stateOf(r), note: explain(r) });
          router.refresh();
        }}
        className="rounded-md border border-border px-3 py-2 sm:px-2.5 sm:py-1 text-xs hover:border-accent-cyan/40 disabled:opacity-50"
      >
        {state?.state === "sending" ? "Sending…" : label}
      </button>
      {state?.state === "sending" && (
        <div className="h-1 w-24 overflow-hidden rounded-full bg-bg-raised">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-accent-cyan" />
        </div>
      )}
      {state?.note && <p className={`text-[11px] ${state.state === "failed" ? "text-status-danger" : state.state === "skipped" ? "text-status-warning" : "text-status-success"}`}>{state.note}</p>}
    </div>
  );
}
