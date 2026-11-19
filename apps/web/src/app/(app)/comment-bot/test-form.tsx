"use client";

import { useActionState } from "react";
import { testReply, type TestReplyState } from "@/lib/actions/comment-bot";

const input = "w-full rounded-lg bg-bg-raised border border-border px-3 py-2 text-sm";

const EXAMPLES = ["FABLE", "nice content bro 🔥", "what mic do you use?", "FABLE does this work on Windows?", "check my channel sub4sub"];

function describe(state: TestReplyState): string {
  const p = state.plan!;
  const where = state.platform === "INSTAGRAM" ? "Instagram" : "YouTube";
  if (p.action === "KEYWORD" && !p.privateReply && state.platform === "INSTAGRAM") {
    return `Keyword ${p.matchedKeyword}: the prompt isn't added yet, so it replies with the page link ("coming soon").`;
  }
  switch (p.action) {
    case "KEYWORD":
      return state.platform === "INSTAGRAM"
        ? `Keyword ${p.matchedKeyword}: DMs the prompt with its link, and posts a short public reply.`
        : `Keyword ${p.matchedKeyword}: replies publicly with the link to the prompt's page on your site (YouTube has no DMs).`;
    case "KEYWORD_AND_ANSWER":
      return `Keyword ${p.matchedKeyword} plus a question: answers it and sends the prompt.`;
    case "AI_ANSWER":
      return `A question: the AI answers it publicly on ${where}.`;
    case "GENERAL":
      return `A general comment: replies with a short thank-you on ${where}.`;
    default:
      return "No reply.";
  }
}

export function TestReplyForm() {
  const [state, action, pending] = useActionState<TestReplyState, FormData>(testReply, {});
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_170px]">
        <label className="block space-y-1">
          <span className="text-xs font-medium">A comment someone might write</span>
          <input name="comment" list="test-examples" required placeholder='e.g. "FABLE" or "nice video!"' className={input} />
          <datalist id="test-examples">
            {EXAMPLES.map((e) => (
              <option key={e} value={e} />
            ))}
          </datalist>
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-medium">Where</span>
          <select name="platform" className={input} defaultValue="INSTAGRAM">
            <option value="INSTAGRAM">Instagram</option>
            <option value="YOUTUBE">YouTube</option>
          </select>
        </label>
      </div>
      <label className="block space-y-1">
        <span className="text-xs font-medium">Video title (optional: gives the AI context for questions)</span>
        <input name="title" placeholder="e.g. Claude Fable 5.2 Built an Entire OS" className={input} />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button disabled={pending} className="rounded-lg bg-accent-cyan text-bg font-medium text-sm px-5 py-2 disabled:opacity-50">
          {pending ? "Thinking…" : "Show me the reply"}
        </button>
        <span className="text-xs text-text-dim">Try: {EXAMPLES.slice(0, 3).map((e) => `“${e}”`).join(", ")}</span>
      </div>

      {state.error && <p className="rounded-lg border border-status-danger/30 bg-status-danger/10 p-3 text-sm text-status-danger">{state.error}</p>}
      {state.plan && (
        <div className="panel-raised p-4 space-y-3 text-sm">
          <p className="font-medium">{describe(state)}</p>
          {state.plan.privateReply && (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-text-faint mb-1">Instagram DM</p>
              <p className="whitespace-pre-wrap rounded-lg bg-bg p-3">{state.plan.privateReply}</p>
            </div>
          )}
          {state.plan.publicReply && (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-text-faint mb-1">Public reply under the comment</p>
              <p className="whitespace-pre-wrap rounded-lg bg-bg p-3">{state.plan.publicReply}</p>
            </div>
          )}
          {state.plan.skipReason && <p className="text-status-warning">Why no reply: {state.plan.skipReason}</p>}
          <p className="text-xs text-text-dim">Preview only. Nothing was posted. Change the wording in Reply messages.</p>
        </div>
      )}
    </form>
  );
}
