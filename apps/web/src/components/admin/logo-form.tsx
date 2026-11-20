"use client";

import { useActionState, useState } from "react";
import { saveLogo, type FormState } from "@/lib/actions/resources";

export function LogoForm({ hasUpload }: { hasUpload: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveLogo, {});
  const [preview, setPreview] = useState<string | null>(null);
  // Bust the browser cache after a change so the new logo shows straight away.
  const src = preview ?? (state.saved ? `/api/logo?v=${Date.now()}` : "/api/logo");
  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Current logo" className="h-16 w-16 rounded-xl object-cover bg-bg-raised border border-border" />
      <div className="space-y-2 min-w-[220px] flex-1">
        <p className="text-sm font-medium">Logo</p>
        <p className="text-xs text-text-dim">
          {hasUpload ? "Using your uploaded logo." : "Using your YouTube profile picture. Upload a square image to use something else."}
        </p>
        <form action={action} className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            name="logo"
            accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setPreview(f ? URL.createObjectURL(f) : null);
            }}
            className="text-xs text-text-dim file:mr-2 file:rounded-lg file:border file:border-border file:bg-bg-raised file:px-3 file:py-1.5 file:text-text"
          />
          <button disabled={pending} className="rounded-lg bg-accent-cyan text-bg text-xs font-medium px-3 py-1.5 disabled:opacity-50">
            {pending ? "Saving…" : "Upload logo"}
          </button>
        </form>
        {hasUpload && (
          <form action={action}>
            <input type="hidden" name="remove" value="1" />
            <button className="text-xs text-text-dim hover:text-text underline">Use my YouTube profile picture instead</button>
          </form>
        )}
        {state.error && <p className="text-xs text-status-danger">{state.error}</p>}
        {state.saved && <p className="text-xs text-status-success">Saved. It can take a minute to update everywhere.</p>}
      </div>
    </div>
  );
}
