"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { importPrompt, removeVideoPrompt, saveVideo, type VideoFormState } from "@/lib/actions/videos";
import { inputClass } from "@/components/form-fields";
import type { VideoRowData } from "./types";

/** Edits one video's prompt: name, keyword, text (typed, or imported from a file / Google Doc), extra link. */
export function VideoEditor({ video, onDone }: { video: VideoRowData; onDone: () => void }) {
  const [state, action, pending] = useActionState<VideoFormState, FormData>(saveVideo, {});
  const [prompt, setPrompt] = useState(video.prompt ?? "");
  const [keyword, setKeyword] = useState(video.keyword ?? "");
  const [source, setSource] = useState<{ source: string; filename: string | null } | null>(null);
  const [importing, startImport] = useTransition();
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [docLink, setDocLink] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  // An uploaded document is kept as-is and sent to viewers as a download; its text only fills the box below.
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [removeFile, setRemoveFile] = useState(false);
  const attachedName = pendingFile?.name ?? (removeFile ? null : video.attachment?.name ?? null);

  function runImport(fd: FormData) {
    startImport(async () => {
      const r = await importPrompt(fd);
      if (r.error || (!r.text && !r.filename)) {
        if (fd.get("file")) setPendingFile(null);
        setImportMsg({ ok: false, text: r.error ?? "Nothing to import." });
        return;
      }
      if (r.text) setPrompt(r.text);
      if (r.keyword && !keyword) setKeyword(r.keyword);
      setSource({ source: r.source ?? "text", filename: r.filename ?? null });
      setImportMsg({
        ok: true,
        text: r.filename
          ? `${r.filename} is ready. Click Save: your site shows it as it looks, with a Download button.`
          : `Imported ${(r.text ?? "").length.toLocaleString()} characters. Check it below, then Save.`,
      });
    });
  }

  return (
    <div className="border-t border-border-subtle bg-bg-raised/40 p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-full sm:w-auto text-xs font-medium text-text-dim">Fill the prompt from:</span>
        <button type="button" onClick={() => fileRef.current?.click()} disabled={importing} className="rounded-lg border border-border px-3 py-1.5 text-xs hover:border-accent-cyan/40 disabled:opacity-50">
          📄 A file (.docx, .pdf, .txt, .md)
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".docx,.pdf,.txt,.md"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const fd = new FormData();
            fd.set("file", f);
            setPendingFile(f);
            setRemoveFile(false);
            runImport(fd);
            e.target.value = "";
          }}
        />
        <div className="flex w-full sm:w-auto sm:flex-1 sm:min-w-[260px] gap-2">
          <input value={docLink} onChange={(e) => setDocLink(e.target.value)} placeholder="…or paste a Google Doc link" className={`${inputClass} py-1.5 text-xs`} />
          <button
            type="button"
            disabled={importing || !docLink.trim()}
            onClick={() => {
              const fd = new FormData();
              fd.set("docLink", docLink);
              runImport(fd);
            }}
            className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs hover:border-accent-cyan/40 disabled:opacity-50"
          >
            Import
          </button>
        </div>
      </div>
      {importing && <p className="text-xs text-accent-cyan">Reading…</p>}
      {importMsg && <p className={`text-xs ${importMsg.ok ? "text-status-success" : "text-status-danger"}`}>{importMsg.text}</p>}

      {attachedName && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-accent-cyan/30 bg-accent-cyan/5 px-3 py-2.5 text-sm">
          <span className="min-w-0 flex-1">
            📎 <span className="font-medium">{attachedName}</span>
            <span className="block text-xs text-text-dim">
              Sent as a file: the bot DMs a download link, and the website shows a Download button.
              {pendingFile ? " Click Save to keep it." : ""}
            </span>
          </span>
          <button
            type="button"
            onClick={() => {
              if (pendingFile) setPendingFile(null);
              else setRemoveFile(true);
            }}
            className="text-xs text-status-danger hover:underline"
          >
            Remove file
          </button>
        </div>
      )}

      <form
        action={(fd) => {
          if (pendingFile) fd.set("attachment", pendingFile);
          if (removeFile) fd.set("removeAttachment", "on");
          return action(fd);
        }}
        className="space-y-4"
      >
        <input type="hidden" name="id" value={video.id} />
        <input type="hidden" name="promptSource" value={source?.source ?? ""} />
        <input type="hidden" name="promptFilename" value={source?.filename ?? ""} />

        <label className="block space-y-1">
          <span className="text-xs font-medium">{attachedName ? "Text from the file (for search; the website shows the file itself)" : "Prompt or resource text"}</span>
          <textarea
            name="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={8}
            placeholder="Paste or type the prompt, or import it from a file / Google Doc above."
            className={`${inputClass} font-mono text-[13px]`}
          />
          <span className="block text-[11px] text-text-faint">
            {attachedName
              ? "Viewers see the file itself on your site, formatted as it looks, and can copy from it. The bot sends a download link."
              : "This is what viewers see and copy on your site, and what the bot sends. Upload a file above to share a document instead."}
          </span>
        </label>

        <label className="block space-y-1">
          <span className="text-xs font-medium">Viewers see this as</span>
          <select name="contentKind" defaultValue={video.contentKind ?? ""} className={`${inputClass} sm:max-w-[360px]`}>
            <option value="">Automatic (now: {video.kind === "prompt" ? "a prompt" : "a resource"})</option>
            <option value="prompt">A prompt (text to paste into an AI)</option>
            <option value="resource">A resource (a guide, setup steps, template or file)</option>
          </select>
          <span className="block text-[11px] text-text-faint">Changes the wording on your site and in the bot&apos;s messages: &ldquo;Here&apos;s the prompt…&rdquo; or &ldquo;Here&apos;s the resource…&rdquo;.</span>
        </label>

        <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
          <label className="block space-y-1">
            <span className="text-xs font-medium">Keyword</span>
            <input name="keyword" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="e.g. GAME" className={inputClass} />
            <span className="block text-[11px] text-text-faint">The word viewers comment, in any case (game, Game, GAME). Several? Separate with commas.</span>
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium">Name (optional)</span>
            <input name="resourceTitle" defaultValue={video.resourceTitle ?? ""} placeholder="e.g. Immich setup guide" className={inputClass} />
            <span className="block text-[11px] text-text-faint">Shown at the top of the document on your site. Defaults to the file name or the video title.</span>
          </label>
        </div>

        <label className="block space-y-1">
          <span className="text-xs font-medium">Extra link (optional)</span>
          <input name="extraLink" defaultValue={video.extraLink ?? ""} placeholder="https://… a tool, template or download" className={inputClass} />
        </label>

        <div className="space-y-2">
          {video.twin && (
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" name="twinId" value={video.twin.id} defaultChecked={!video.twin.hasPrompt} className="mt-1" />
              <span>
                Also use this for <span className="font-medium">{video.twin.label}</span>
                <span className="block text-xs text-text-dim">Looks like the same content on {video.platform === "YOUTUBE" ? "Instagram" : "YouTube"}. Tick to give it the same prompt and keyword.</span>
              </span>
            </label>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="hidden" defaultChecked={video.hidden} />
            Hide this video from the website and the bot
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button disabled={pending} className="rounded-lg bg-accent-cyan text-bg font-medium text-sm px-5 py-2 disabled:opacity-50">
            {pending ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={onDone} className="rounded-lg border border-border px-4 py-2 text-sm text-text-dim hover:text-text">
            Close
          </button>
          {state.error && <p className="text-sm text-status-danger">{state.error}</p>}
          {state.saved && <p className="text-sm text-status-success">{state.saved}</p>}
        </div>
      </form>

      {video.prompt && (
        <form action={removeVideoPrompt} onSubmit={(e) => !confirm("Remove this video's prompt and keyword?") && e.preventDefault()}>
          <input type="hidden" name="id" value={video.id} />
          <button className="text-xs text-status-danger hover:underline">Remove prompt</button>
        </form>
      )}
    </div>
  );
}
