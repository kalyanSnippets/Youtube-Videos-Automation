"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { removeVideoPrompt, saveVideo, type VideoFormState } from "@/lib/actions/videos";
import { Badge } from "@/components/ui/badge";
import { inputClass } from "@/components/form-fields";

export interface VideoCardData {
  id: string;
  platform: string;
  title: string;
  watchUrl: string;
  thumbnailUrl: string | null;
  publishedAt: string | null;
  keyword: string | null;
  hasPrompt: boolean;
  promptSource: string | null;
  promptFilename: string | null;
  promptPreview: string | null;
  hidden: boolean;
  slug: string;
  format: string | null;
}

export function formatLabel(v: Pick<VideoCardData, "platform" | "format">): string {
  if (v.platform === "YOUTUBE") return v.format === "SHORT" ? "YouTube Short" : "YouTube video";
  return v.format === "REEL" ? "Instagram Reel" : "Instagram post";
}

function statusOf(v: VideoCardData): { label: string; variant: "success" | "warning" | "default" | "danger" } {
  if (v.hidden) return { label: "Hidden", variant: "default" };
  if (v.hasPrompt && v.keyword) return { label: "Live on site", variant: "success" };
  if (v.hasPrompt) return { label: "Add a keyword", variant: "warning" };
  return { label: "Needs prompt", variant: "warning" };
}

export function VideoCard({ video }: { video: VideoCardData }) {
  const [state, action, pending] = useActionState<VideoFormState, FormData>(saveVideo, {});
  const [showPaste, setShowPaste] = useState(false);
  const status = statusOf(video);
  const date = video.publishedAt ? new Date(video.publishedAt).toLocaleDateString() : "";
  return (
    <article className="panel p-4 sm:p-5 space-y-4">
      <div className="flex gap-4">
        <div className="relative h-20 w-36 shrink-0 overflow-hidden rounded-lg bg-bg-raised">
          <Image src={`/api/thumb/${video.id}`} alt="" fill sizes="144px" className="object-cover" unoptimized />
        </div>
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={video.platform === "YOUTUBE" ? "danger" : "purple"}>{formatLabel(video)}</Badge>
            <Badge variant={status.variant}>{status.label}</Badge>
            {date && <span className="text-xs text-text-dim">{date}</span>}
          </div>
          <h3 className="font-medium leading-snug line-clamp-2">{video.title}</h3>
          <div className="flex flex-wrap gap-3 text-xs">
            <a href={video.watchUrl} target="_blank" rel="noopener" className="text-accent-cyan hover:underline">Watch ↗</a>
            <a href={`/v/${video.slug}`} target="_blank" className="text-text-dim hover:text-text">Public page ↗</a>
          </div>
        </div>
      </div>

      {video.hasPrompt && video.promptPreview && (
        <div className="panel-raised p-3 text-xs text-text-dim">
          <p className="mb-1">
            Prompt from {video.promptSource}
            {video.promptFilename ? ` · ${video.promptFilename}` : ""}
          </p>
          <p className="line-clamp-3 whitespace-pre-wrap text-text">{video.promptPreview}</p>
        </div>
      )}

      <form action={action} className="space-y-3">
        <input type="hidden" name="id" value={video.id} />
        <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
          <label className="block space-y-1">
            <span className="text-xs font-medium">Keyword</span>
            <input name="keyword" defaultValue={video.keyword ?? ""} placeholder="EDIT" className={inputClass} />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium">Prompt file</span>
            <input name="file" type="file" accept=".docx,.pdf,.txt,.md" className="block w-full text-xs text-text-dim file:mr-3 file:rounded-lg file:border file:border-border file:bg-bg-raised file:px-3 file:py-2 file:text-text" />
            <span className="block text-[11px] text-text-faint">Word (.docx), PDF, text or Markdown, up to 5 MB.</span>
          </label>
        </div>
        <label className="block space-y-1">
          <span className="text-xs font-medium">…or a Google Doc link</span>
          <input name="docLink" placeholder="https://docs.google.com/document/d/…" className={inputClass} />
          <span className="block text-[11px] text-text-faint">The doc must be shared as "Anyone with the link can view".</span>
        </label>
        {showPaste ? (
          <label className="block space-y-1">
            <span className="text-xs font-medium">…or paste the text</span>
            <textarea name="pasted" rows={5} className={`${inputClass} font-mono text-[13px]`} />
          </label>
        ) : (
          <button type="button" onClick={() => setShowPaste(true)} className="text-xs text-accent-cyan hover:underline">
            Paste the text instead
          </button>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" name="hidden" defaultChecked={video.hidden} />
            Hide this video from the site and the bot
          </label>
          <button disabled={pending} className="rounded-lg bg-accent-cyan text-bg font-medium text-sm px-4 py-2 disabled:opacity-50">
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
        {state.error && <p className="text-sm text-status-danger">{state.error}</p>}
        {state.saved && <p className="text-sm text-status-success">{state.saved}</p>}
      </form>

      {video.hasPrompt && (
        <form action={removeVideoPrompt}>
          <input type="hidden" name="id" value={video.id} />
          <button className="text-xs text-status-danger hover:underline">Remove prompt</button>
        </form>
      )}
    </article>
  );
}
