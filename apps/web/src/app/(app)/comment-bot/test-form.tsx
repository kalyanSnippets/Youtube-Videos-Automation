"use client";

import { useActionState } from "react";
import { testReply, type TestReplyState } from "@/lib/actions/comment-bot";

const input = "w-full rounded-lg bg-bg-raised border border-border px-3 py-2 text-sm";

export function TestReplyForm() {
  const [state, action, pending] = useActionState<TestReplyState, FormData>(testReply, {});
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
        <input name="comment" placeholder='Try "FABLE" or "does this work on Windows?"' className={input} />
        <select name="platform" className={input} defaultValue="INSTAGRAM">
          <option value="INSTAGRAM">Instagram</option>
          <option value="YOUTUBE">YouTube</option>
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <input name="title" placeholder="Video title (optional, gives the AI context)" className={input} />
        <button disabled={pending} className="rounded-lg bg-accent-cyan/20 border border-accent-cyan/40 px-4 py-2 text-sm text-accent-cyan disabled:opacity-50">
          {pending ? "Thinking…" : "Preview reply"}
        </button>
      </div>
      {state.error && <p className="text-sm text-status-danger">{state.error}</p>}
      {state.plan && (
        <div className="panel-raised p-4 space-y-3 text-sm">
          <p className="text-text-dim">
            Action: <span className="text-text">{state.plan.action}</span>
            {state.plan.matchedKeyword && <> · keyword <span className="text-text">{state.plan.matchedKeyword}</span></>}
          </p>
          {state.plan.publicReply && (
            <div>
              <p className="text-xs uppercase tracking-wide text-text-dim mb-1">Public reply</p>
              <p className="whitespace-pre-wrap">{state.plan.publicReply}</p>
            </div>
          )}
          {state.plan.privateReply && (
            <div>
              <p className="text-xs uppercase tracking-wide text-text-dim mb-1">Instagram DM</p>
              <p className="whitespace-pre-wrap">{state.plan.privateReply}</p>
            </div>
          )}
          {state.plan.skipReason && <p className="text-status-warning">Skipped: {state.plan.skipReason}</p>}
          <p className="text-xs text-text-dim">Preview only. Nothing was posted.</p>
        </div>
      )}
    </form>
  );
}
