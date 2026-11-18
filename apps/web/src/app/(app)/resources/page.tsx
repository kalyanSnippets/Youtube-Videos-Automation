import Link from "next/link";
import { Plus } from "lucide-react";
import { siteBaseUrl } from "@yaos/comment-bot";
import { Badge } from "@/components/ui/badge";
import { getSiteSettings, listResources } from "@/lib/site";
import { SiteSettingsForm } from "./settings-form";

export default async function ResourcesAdminPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const [resources, settings, { saved }] = await Promise.all([listResources(), getSiteSettings(), searchParams]);
  const site = siteBaseUrl() ?? "";
  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px]">
          <h1 className="text-xl font-semibold mb-1">Resources</h1>
          <p className="text-sm text-text-dim">
            Prompts and templates for your viewers. Each one gets a public page, and its keywords are what the comment bot listens for.
          </p>
        </div>
        <a href="/" target="_blank" className="rounded-lg border border-border px-3.5 py-2 text-sm text-text-dim hover:text-text">View site ↗</a>
        <Link href="/resources/new" className="inline-flex items-center gap-1.5 rounded-lg bg-accent-cyan text-bg font-medium text-sm px-3.5 py-2">
          <Plus size={15} /> New resource
        </Link>
      </div>
      {saved && <p className="text-sm text-status-success">Saved. The site and bot use it within 30 seconds.</p>}

      <div className="panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-text-dim border-b border-border-subtle">
              <th className="p-3 font-medium">Title</th>
              <th className="p-3 font-medium">Keywords</th>
              <th className="p-3 font-medium">Page</th>
              <th className="p-3 font-medium">Views</th>
              <th className="p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {resources.map((r) => (
              <tr key={r.id}>
                <td className="p-3">
                  <Link href={`/resources/${r.id}`} className="font-medium hover:text-accent-cyan">{r.title}</Link>
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {(r.keywords ?? []).map((k) => <Badge key={k} variant="cyan">{k}</Badge>)}
                    {!r.keywords?.length && <span className="text-xs text-text-dim">site only</span>}
                  </div>
                </td>
                <td className="p-3 text-text-dim">
                  <a href={`/r/${r.slug}`} target="_blank" className="hover:text-text">/r/{r.slug}</a>
                </td>
                <td className="p-3 text-text-dim">{r.views}</td>
                <td className="p-3">{r.published ? <Badge variant="success">Published</Badge> : <Badge>Draft</Badge>}</td>
              </tr>
            ))}
            {!resources.length && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-text-dim">
                  No resources yet. <Link href="/resources/new" className="text-accent-cyan">Add your first one</Link>, e.g. the prompts from your latest Reel.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <section className="panel p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-text-dim uppercase tracking-wide">Site settings</h2>
          <p className="text-xs text-text-dim mt-1">Public address: {site || "set after the first Netlify deploy"}</p>
        </div>
        <SiteSettingsForm settings={settings} />
      </section>
    </div>
  );
}
