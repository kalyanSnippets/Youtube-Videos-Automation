"use client";

import { useActionState, useState } from "react";
import { importPackageAction, type PackageImportState } from "@/lib/actions/packages";
import { inputClass } from "@/components/form-fields";

export function ImportForm() {
  const [state, action, pending] = useActionState<PackageImportState, FormData>(importPackageAction, {});
  const [fileName, setFileName] = useState<string | null>(null);
  const s = state.summary;

  return (
    <form action={action} className="panel p-4 sm:p-5 space-y-3">
      <div>
        <h2 className="font-semibold">Import an upload package</h2>
        <p className="text-sm text-text-dim">
          Paste the whole package Claude gave you (use the copy button on Claude&apos;s message so the formatting comes along), or upload it as a .md file.
        </p>
      </div>
      <textarea name="text" rows={7} placeholder="## Reel 1: …&#10;**YouTube title:** …&#10;**Comment keyword:** GAME …" className={`${inputClass} font-mono text-[12px]`} />
      <div className="flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-lg border border-border px-3 py-2 text-xs hover:border-accent-cyan/40">
          📄 {fileName ?? "…or choose a .md file"}
          <input name="file" type="file" accept=".md,.markdown,.txt" className="hidden" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)} />
        </label>
        <button disabled={pending} className="rounded-lg bg-accent-cyan text-bg font-medium text-sm px-5 py-2 disabled:opacity-50">
          {pending ? "Importing…" : "Import"}
        </button>
      </div>

      {state.error && <p className="text-sm text-status-danger">{state.error}</p>}
      {s && s.added.length > 0 && (
        <div className="rounded-lg bg-status-success/5 border border-status-success/30 p-3 text-sm space-y-1">
          <p className="font-medium text-status-success">
            Imported {s.added.length} video{s.added.length === 1 ? "" : "s"}: {s.added.map((a) => `${a.keywords.join("/")}`).join(", ")}
          </p>
          {s.applied.length > 0 ? (
            s.applied.map((line) => <p key={line} className="text-text-dim">✓ {line}</p>)
          ) : (
            <p className="text-text-dim">None of these videos are posted yet. Each one is set up automatically within an hour of going live.</p>
          )}
        </div>
      )}
      {s && s.skipped.length > 0 && (
        <div className="text-xs text-text-dim space-y-0.5">
          <p className="font-medium text-text">Not used by the bot:</p>
          {s.skipped.map((k) => (
            <p key={k.label}>
              {k.label}: {k.reason}
            </p>
          ))}
        </div>
      )}
    </form>
  );
}
