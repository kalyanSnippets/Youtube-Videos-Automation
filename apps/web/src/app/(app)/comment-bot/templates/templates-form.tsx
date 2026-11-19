"use client";

import { useActionState, useMemo, useState } from "react";
import {
  DEFAULT_TEMPLATES,
  PLACEHOLDERS,
  TEMPLATE_PRESETS,
  fillTemplate,
  renderDelivery,
  type ReplyTemplates,
} from "@yaos/comment-bot/templates";
import { saveTemplates, type TemplatesFormState } from "@/lib/actions/comment-bot";
import { inputClass } from "@/components/form-fields";

const SAMPLE = {
  name: "ravi",
  title: "Claude Fable 5.2: 3 ready-to-use prompts",
  keyword: "FABLE",
  prompt: "1️⃣ CODING: \"You are a senior software engineer. Here is my project: [describe it]…\"\n2️⃣ DATA: \"You are a data analyst…\"",
  link: "https://aiwithkalyan.netlify.app/r/fable",
  video: "https://youtu.be/abc123",
  site: "https://aiwithkalyan.com",
};

function Preview({ label, text }: { label: string; text: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] uppercase tracking-wide text-text-faint">{label}</p>
      <p className="panel-raised p-3 text-sm whitespace-pre-wrap">{text}</p>
    </div>
  );
}

export function TemplatesForm({ initial }: { initial: ReplyTemplates }) {
  const [state, action, pending] = useActionState<TemplatesFormState, FormData>(saveTemplates, {});
  const [t, setT] = useState<ReplyTemplates>(initial);
  const [igReplies, setIgReplies] = useState(initial.igPublicReplies.join("\n"));
  const [generalLines, setGeneralLines] = useState(initial.generalReplies.join("\n"));
  const set = (patch: Partial<ReplyTemplates>) => setT((prev) => ({ ...prev, ...patch }));
  const load = (p: ReplyTemplates) => {
    setT(p);
    setIgReplies(p.igPublicReplies.join("\n"));
    setGeneralLines(p.generalReplies.join("\n"));
  };

  const previews = useMemo(() => {
    const replies = igReplies.split("\n").map((x) => x.trim()).filter(Boolean);
    return {
      igPublic: replies.length ? fillTemplate(replies[0]!, SAMPLE) : "",
      igDm: renderDelivery(t.igDm, SAMPLE, 1000),
      yt: renderDelivery(t.youtubeKeywordReply, { ...SAMPLE, name: "@ravi" }, 9000),
      general:
        t.generalMode === "off"
          ? "(no reply)"
          : t.generalMode === "ai"
            ? "(the AI writes a short thank-you about their comment, in your style)"
            : fillTemplate(generalLines.split("\n").map((x) => x.trim()).find(Boolean) ?? "", { name: "ravi", title: "" }),
    };
  }, [t, igReplies, generalLines]);

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-text-dim uppercase tracking-wide">Start from a template</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TEMPLATE_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => load(p.templates)}
              className="panel p-4 text-left hover:border-accent-cyan/40 transition space-y-1.5"
            >
              <p className="font-medium text-sm">{p.label}</p>
              <p className="text-xs text-text-dim">{p.description}</p>
              <p className="text-xs text-text-faint line-clamp-2">“{fillTemplate(p.templates.igPublicReplies[0] ?? "", SAMPLE)}”</p>
            </button>
          ))}
        </div>
        <p className="text-xs text-text-dim">Clicking a template fills the form below. Nothing is saved until you click Save.</p>
      </section>

      <div className="flex flex-wrap gap-2 text-xs">
        {PLACEHOLDERS.map((p) => (
          <span key={p.token} className="badge border bg-bg-raised border-border text-text-dim" title={p.meaning}>
            <code className="text-accent-cyan">{p.token}</code> {p.meaning}
          </span>
        ))}
      </div>

      <form action={action} className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Instagram public reply (when someone comments a keyword)</span>
            <textarea name="igPublicReplies" value={igReplies} onChange={(e) => setIgReplies(e.target.value)} rows={5} className={inputClass} />
            <span className="block text-xs text-text-dim">One reply per line. The bot picks one at random, so replies don't look copy-pasted.</span>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Instagram DM (the prompt)</span>
            <textarea name="igDm" value={t.igDm} onChange={(e) => set({ igDm: e.target.value })} rows={7} className={`${inputClass} font-mono text-[13px]`} />
            <span className="block text-xs text-text-dim">Must include {"{prompt}"}. Instagram allows 1,000 characters; long prompts are cut and the reader is sent to {"{link}"}.</span>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">YouTube reply (public: YouTube has no DMs)</span>
            <textarea
              name="youtubeKeywordReply"
              value={t.youtubeKeywordReply}
              onChange={(e) => set({ youtubeKeywordReply: e.target.value })}
              rows={7}
              className={`${inputClass} font-mono text-[13px]`}
            />
            <span className="block text-xs text-text-dim">
              Include {"{link}"}: it sends viewers to the prompt&apos;s page on your site (with a Copy button). Use {"{prompt}"} instead to paste the whole prompt into the comment.
            </span>
          </label>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">General comments (no keyword, no question), e.g. “nice content!”</legend>
            <input type="hidden" name="generalMode" value={t.generalMode} />
            {(
              [
                ["ai", "AI writes a short thank-you", "Specific to what they said, in your style below."],
                ["fixed", "Use my thank-you lines", "One of your lines below, picked at random. The AI still filters out spam."],
                ["off", "Don't reply", "Only keywords and questions get replies."],
              ] as const
            ).map(([value, label, hint]) => (
              <label key={value} className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer ${t.generalMode === value ? "border-accent-cyan/50 bg-accent-cyan/5" : "border-border"}`}>
                <input type="radio" checked={t.generalMode === value} onChange={() => set({ generalMode: value })} className="mt-1" />
                <span>
                  <span className="block text-sm">{label}</span>
                  <span className="block text-xs text-text-dim">{hint}</span>
                </span>
              </label>
            ))}
            {t.generalMode === "fixed" && (
              <textarea name="generalReplies" value={generalLines} onChange={(e) => setGeneralLines(e.target.value)} rows={4} className={inputClass} placeholder="Thank you so much, {name}! 🙌" />
            )}
            {t.generalMode !== "fixed" && <input type="hidden" name="generalReplies" value={generalLines} />}
          </fieldset>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">AI style (for answers to questions{t.generalMode === "ai" ? " and thank-yous" : ""})</span>
            <textarea name="aiStyle" value={t.aiStyle} onChange={(e) => set({ aiStyle: e.target.value })} rows={3} className={inputClass} />
            <span className="block text-xs text-text-dim">Describe the tone. Safety rules (no links, no invented facts, skip spam) always apply.</span>
          </label>
          {state.error && <p className="text-sm text-status-danger">{state.error}</p>}
          {state.saved && <p className="text-sm text-status-success">Saved. New comments use these messages within 30 seconds.</p>}
          <div className="flex flex-wrap gap-3">
            <button disabled={pending} className="rounded-lg bg-accent-cyan text-bg font-medium text-sm px-4 py-2 disabled:opacity-50">
              {pending ? "Saving…" : "Save messages"}
            </button>
            <button type="button" onClick={() => load(DEFAULT_TEMPLATES)} className="rounded-lg border border-border px-4 py-2 text-sm text-text-dim hover:text-text">
              Reset to default
            </button>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-4 self-start">
          <h2 className="text-sm font-semibold text-text-dim uppercase tracking-wide">Preview</h2>
          <p className="text-xs text-text-dim">@ravi comments “FABLE”:</p>
          <Preview label="Instagram public reply" text={previews.igPublic} />
          <Preview label="Instagram DM" text={previews.igDm} />
          <Preview label="YouTube reply" text={previews.yt} />
          <p className="text-xs text-text-dim pt-2">@ravi comments “nice content!”:</p>
          <Preview label="Reply (Instagram and YouTube)" text={previews.general} />
        </aside>
      </form>
    </div>
  );
}
