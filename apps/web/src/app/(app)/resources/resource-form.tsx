"use client";

import { useActionState } from "react";
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
  published: boolean;
  sortOrder: number;
}

export function ResourceForm({ values, siteUrl }: { values: ResourceFormValues; siteUrl: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveResource, {});
  return (
    <form action={action} className="panel p-6 space-y-5">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <Field label="Title" hint="Shown on the site and in the bot's message, e.g. 'Fable 5.2 starter prompts'.">
        <input name="title" defaultValue={values.title} required className={inputClass} />
      </Field>
      <Field label="Keywords" hint="What viewers comment to get this, separated by commas, e.g. FABLE, FABLE5. Leave empty if it's only for the website.">
        <input name="keywords" defaultValue={values.keywords} className={inputClass} placeholder="FABLE" />
      </Field>
      <Field label="Short description" hint="One or two lines for the card on the home page.">
        <input name="summary" defaultValue={values.summary} className={inputClass} />
      </Field>
      <Field label="Prompt / resource text" hint="This is what viewers copy and what the bot sends.">
        <textarea name="body" defaultValue={values.body} required rows={12} className={`${inputClass} font-mono text-[13px]`} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Video link (optional)" hint="The YouTube video or Reel this belongs to.">
          <input name="videoUrl" defaultValue={values.videoUrl} className={inputClass} placeholder="https://youtu.be/..." />
        </Field>
        <Field label="Extra link (optional)" hint="A tool, download or template link.">
          <input name="link" defaultValue={values.link} className={inputClass} placeholder="https://..." />
        </Field>
        <Field label="Page address" hint={`${siteUrl}/r/${values.slug || "made-from-title"}`}>
          <input name="slug" defaultValue={values.slug} className={inputClass} placeholder="made from the title if empty" />
        </Field>
        <Field label="Order" hint="Lower numbers show first on the home page.">
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
