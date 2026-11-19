"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { saveResource, type FormState } from "@/lib/actions/resources";
import { Field, inputClass } from "@/components/form-fields";

export interface ResourceFormValues {
  id?: string;
  title: string;
  slug: string;
  keywords: string;
  summary: string;
  body: string;
  link: string;
  videoUrl: string;
  instagramUrl: string;
  published: boolean;
  sortOrder: number;
}

/** A synced YouTube/Instagram video the form can copy details from. */
export interface PickableVideo {
  id: string;
  platform: string;
  format: string | null;
  title: string;
  description: string | null;
  watchUrl: string;
  keyword: string | null;
  prompt: string | null;
  publishedAt: string | null;
}

type Fields = Omit<ResourceFormValues, "id" | "published" | "sortOrder">;

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/[\s_]+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 80) || ""
  );
}

/** "My video #shorts #ai 🔥" -> "My video 🔥" */
function cleanTitle(title: string): string {
  return title.replace(/(^|\s)#[\p{L}\p{N}_]+/gu, " ").replace(/\s{2,}/g, " ").trim();
}

/** First meaningful line of a description/caption that isn't the title or a wall of hashtags. */
function summaryFrom(video: PickableVideo): string {
  const title = cleanTitle(video.title).toLowerCase();
  const lines = (video.description ?? "")
    .split("\n")
    .map((l) => cleanTitle(l))
    .filter((l) => l.length > 3 && !/^https?:\/\//.test(l));
  const line = lines.find((l) => l.toLowerCase() !== title) ?? lines[0] ?? "";
  return line.length > 200 ? `${line.slice(0, 197)}…` : line;
}

function words(text: string): Set<string> {
  return new Set(
    cleanTitle(text)
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2),
  );
}

/** Finds the same piece of content on the other platform: shared title words, posted around the same time. */
function bestMatch(video: PickableVideo, others: PickableVideo[]): PickableVideo | null {
  const a = words(`${video.title} ${video.description?.slice(0, 200) ?? ""}`);
  let best: { v: PickableVideo; score: number } | null = null;
  for (const o of others) {
    const b = words(`${o.title} ${o.description?.slice(0, 200) ?? ""}`);
    const shared = [...a].filter((w) => b.has(w)).length;
    const overlap = shared / Math.max(1, Math.min(a.size, b.size));
    const days = video.publishedAt && o.publishedAt ? Math.abs(Date.parse(video.publishedAt) - Date.parse(o.publishedAt)) / 86_400_000 : 99;
    const score = overlap + (days <= 3 ? 0.25 : days <= 10 ? 0.1 : 0);
    if (!best || score > best.score) best = { v: o, score };
  }
  return best && best.score >= 0.5 ? best.v : null;
}

function label(v: PickableVideo): string {
  const kind = v.platform === "YOUTUBE" ? (v.format === "SHORT" ? "Short" : "Video") : v.format === "REEL" ? "Reel" : "Post";
  const date = v.publishedAt ? new Date(v.publishedAt).toLocaleDateString() : "";
  const t = cleanTitle(v.title) || v.title;
  return `${t.length > 70 ? `${t.slice(0, 67)}…` : t} · ${kind}${date ? ` · ${date}` : ""}`;
}

export function ResourceForm({ values, siteUrl, videos = [] }: { values: ResourceFormValues; siteUrl: string; videos?: PickableVideo[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveResource, {});
  const [f, setF] = useState<Fields>({
    title: values.title,
    slug: values.slug,
    keywords: values.keywords,
    summary: values.summary,
    body: values.body,
    link: values.link,
    videoUrl: values.videoUrl,
    instagramUrl: values.instagramUrl,
  });
  // What autofill last put in each field: autofill only replaces a field that is empty or still holds its own value,
  // so anything you typed yourself is never overwritten.
  const autoFilled = useRef<Partial<Fields>>({});
  const [note, setNote] = useState<string | null>(null);

  const youtube = useMemo(() => videos.filter((v) => v.platform === "YOUTUBE"), [videos]);
  const instagram = useMemo(() => videos.filter((v) => v.platform === "INSTAGRAM"), [videos]);
  const ytSelected = youtube.find((v) => v.watchUrl === f.videoUrl)?.id ?? "";
  const igSelected = instagram.find((v) => v.watchUrl === f.instagramUrl)?.id ?? "";

  const change = (key: keyof Fields, value: string) => setF((prev) => ({ ...prev, [key]: value }));

  function autofill(next: Partial<Fields>) {
    setF((prev) => {
      const out = { ...prev };
      for (const [k, v] of Object.entries(next) as [keyof Fields, string][]) {
        if (!v) continue;
        const current = prev[k];
        if (!current || current === autoFilled.current[k]) {
          out[k] = v;
          autoFilled.current[k] = v;
        }
      }
      return out;
    });
  }

  function details(v: PickableVideo): Partial<Fields> {
    const title = cleanTitle(v.title) || v.title;
    return { title, slug: slugify(title), summary: summaryFrom(v), keywords: v.keyword ?? "", body: v.prompt ?? "" };
  }

  function pickYouTube(id: string) {
    const v = youtube.find((x) => x.id === id);
    if (!v) {
      change("videoUrl", "");
      return;
    }
    const match = !f.instagramUrl ? bestMatch(v, instagram) : null;
    autofill({ ...details(v), videoUrl: v.watchUrl, ...(match ? { instagramUrl: match.watchUrl } : {}) });
    setF((prev) => ({ ...prev, videoUrl: v.watchUrl }));
    setNote(match ? `Also found the matching Instagram ${match.format === "REEL" ? "Reel" : "post"}: “${label(match)}”. Change it below if that's wrong.` : null);
  }

  function pickInstagram(id: string) {
    const v = instagram.find((x) => x.id === id);
    if (!v) {
      change("instagramUrl", "");
      return;
    }
    const match = !f.videoUrl ? bestMatch(v, youtube) : null;
    autofill({ ...details(v), instagramUrl: v.watchUrl, ...(match ? { videoUrl: match.watchUrl } : {}) });
    setF((prev) => ({ ...prev, instagramUrl: v.watchUrl }));
    setNote(match ? `Also found the matching YouTube video: “${label(match)}”. Change it below if that's wrong.` : null);
  }

  return (
    <form action={action} className="panel p-6 space-y-5">
      {values.id && <input type="hidden" name="id" value={values.id} />}

      {videos.length > 0 && (
        <div className="panel-raised p-4 space-y-3">
          <div>
            <p className="text-sm font-medium">Fill in from a video</p>
            <p className="text-xs text-text-dim">
              Pick the video this resource belongs to. The title, description, links, keyword and prompt are filled in for you, and the
              matching video on the other platform is found automatically. You can still edit everything.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-xs font-medium">YouTube video or Short</span>
              <select value={ytSelected} onChange={(e) => pickYouTube(e.target.value)} className={inputClass}>
                <option value="">Choose a YouTube video…</option>
                {youtube.map((v) => (
                  <option key={v.id} value={v.id}>
                    {label(v)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium">Instagram Reel or post</span>
              <select value={igSelected} onChange={(e) => pickInstagram(e.target.value)} className={inputClass}>
                <option value="">Choose an Instagram Reel or post…</option>
                {instagram.map((v) => (
                  <option key={v.id} value={v.id}>
                    {label(v)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {note && <p className="text-xs text-accent-cyan">{note}</p>}
        </div>
      )}

      <Field label="Title" hint="Shown on the site and in the bot's message, e.g. 'Fable 5.2 starter prompts'.">
        <input name="title" value={f.title} onChange={(e) => change("title", e.target.value)} required className={inputClass} />
      </Field>
      <Field label="Keywords" hint="What viewers comment to get this, separated by commas, e.g. FABLE, FABLE5. Leave empty if it's only for the website.">
        <input name="keywords" value={f.keywords} onChange={(e) => change("keywords", e.target.value)} className={inputClass} placeholder="FABLE" />
      </Field>
      <Field label="Short description" hint="One or two lines for the card on the home page.">
        <input name="summary" value={f.summary} onChange={(e) => change("summary", e.target.value)} className={inputClass} />
      </Field>
      <Field label="Prompt / resource text" hint="This is what viewers copy and what the bot sends.">
        <textarea name="body" value={f.body} onChange={(e) => change("body", e.target.value)} required rows={12} className={`${inputClass} font-mono text-[13px]`} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="YouTube link (optional)" hint="Filled in when you pick a video above.">
          <input name="videoUrl" value={f.videoUrl} onChange={(e) => change("videoUrl", e.target.value)} className={inputClass} placeholder="https://youtu.be/..." />
        </Field>
        <Field label="Instagram link (optional)" hint="Filled in when you pick a Reel or post above.">
          <input name="instagramUrl" value={f.instagramUrl} onChange={(e) => change("instagramUrl", e.target.value)} className={inputClass} placeholder="https://www.instagram.com/reel/..." />
        </Field>
        <Field label="Extra link (optional)" hint="A tool, download or template link.">
          <input name="link" value={f.link} onChange={(e) => change("link", e.target.value)} className={inputClass} placeholder="https://..." />
        </Field>
        <Field label="Page address" hint={`${siteUrl}/r/${f.slug || "made-from-title"}`}>
          <input name="slug" value={f.slug} onChange={(e) => change("slug", e.target.value)} className={inputClass} placeholder="made from the title if empty" />
        </Field>
        <Field label="Order" hint="Lower numbers show first.">
          <input name="sortOrder" type="number" defaultValue={values.sortOrder} className={inputClass} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="published" defaultChecked={values.published} />
        Published (visible on the site and used by the bot)
      </label>
      {state.error && <p className="text-sm text-status-danger">{state.error}</p>}
      <div className="flex gap-3">
        <button disabled={pending} className="rounded-lg bg-accent-cyan text-bg font-medium text-sm px-4 py-2 disabled:opacity-50">
          {pending ? "Saving…" : "Save resource"}
        </button>
        <a href="/resources" className="rounded-lg border border-border px-4 py-2 text-sm text-text-dim hover:text-text">Cancel</a>
      </div>
    </form>
  );
}
