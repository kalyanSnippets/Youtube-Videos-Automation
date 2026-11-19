"use client";

import { useActionState } from "react";
import { saveSiteSettings, type FormState } from "@/lib/actions/resources";
import { Field, inputClass } from "@/components/form-fields";
import type { SiteSettings } from "@/lib/site";

export function SiteSettingsForm({ settings }: { settings: SiteSettings }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveSiteSettings, {});
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Site name">
          <input name="siteName" defaultValue={settings.siteName} className={inputClass} />
        </Field>
        <Field label="Tagline">
          <input name="tagline" defaultValue={settings.tagline} className={inputClass} />
        </Field>
        <Field label="YouTube channel link">
          <input name="youtubeUrl" defaultValue={settings.youtubeUrl ?? ""} className={inputClass} placeholder="https://youtube.com/@..." />
        </Field>
        <Field label="Instagram link">
          <input name="instagramUrl" defaultValue={settings.instagramUrl ?? ""} className={inputClass} placeholder="https://instagram.com/..." />
        </Field>
      </div>
      <Field
        label="About me (private, for the comment bot's AI)"
        hint="Who you are, your gear, tools, upload schedule, common answers. The AI uses this to reply in your voice. Never shown on the site."
      >
        <textarea name="about" defaultValue={settings.about} rows={6} className={inputClass} placeholder="I'm Kalyan. I make practical AI tutorials in English for beginners. I use a MacBook Pro..." />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="newsletterEnabled" defaultChecked={settings.newsletterEnabled} />
        Show the optional "get new prompts by email" box
      </label>
      {state.error && <p className="text-sm text-status-danger">{state.error}</p>}
      {state.saved && <p className="text-sm text-status-success">Saved.</p>}
      <button disabled={pending} className="rounded-lg bg-accent-cyan text-bg font-medium text-sm px-4 py-2 disabled:opacity-50">
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
