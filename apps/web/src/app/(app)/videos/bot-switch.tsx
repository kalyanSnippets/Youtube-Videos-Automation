"use client";

import { useState, useTransition } from "react";
import { setVideoBot } from "@/lib/actions/videos";

/** On/off switch for the comment bot on one video. New videos start off. */
export function BotSwitch({ videoId, initial }: { videoId: string; initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function toggle() {
    const next = !on;
    setOn(next); // show it straight away; undo if saving fails
    setError(null);
    start(async () => {
      const result = await setVideoBot(videoId, next);
      if (result.error) {
        setOn(!next);
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={on ? "Comment bot is on for this video. Turn off" : "Comment bot is off for this video. Turn on"}
        title={on ? "Bot replies to comments on this video" : "Bot ignores comments on this video"}
        onClick={toggle}
        disabled={pending}
        className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 text-xs disabled:opacity-70"
      >
        <span className={on ? "text-status-success font-medium" : "text-text-dim"}>Bot {on ? "on" : "off"}</span>
        <span className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border transition ${on ? "bg-status-success/80 border-status-success" : "bg-bg-raised border-border"}`}>
          <span className={`absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
        </span>
      </button>
      {error && <span className="text-[11px] text-status-danger">{error}</span>}
    </div>
  );
}
