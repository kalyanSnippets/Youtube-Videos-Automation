import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { ArrowLeft, ExternalLink, PlayCircle } from "lucide-react";
import { db, schema } from "@yaos/database";
import { getSiteSettings } from "@/lib/site";
import { PublicFooter, PublicHeader } from "@/components/public/site-chrome";
import { CopyButton } from "@/components/public/copy-button";
import { NewsletterForm } from "@/components/public/newsletter-form";

export const dynamic = "force-dynamic";

async function getResource(slug: string) {
  const [r] = await db.select().from(schema.resources).where(and(eq(schema.resources.slug, slug), eq(schema.resources.published, true)));
  return r ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const r = await getResource((await params).slug).catch(() => null);
  return r ? { title: r.title, description: r.summary ?? undefined } : { title: "Not found" };
}

export default async function ResourcePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [resource, settings] = await Promise.all([getResource(slug), getSiteSettings()]);
  if (!resource) notFound();
  // Best-effort view counter; never block the page on it.
  db.update(schema.resources).set({ views: sql`${schema.resources.views} + 1` }).where(eq(schema.resources.id, resource.id)).catch(() => undefined);

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader settings={settings} />
      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-8 sm:py-12 space-y-6">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-text-dim hover:text-text">
          <ArrowLeft size={14} /> All prompts
        </Link>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{resource.title}</h1>
          {resource.summary && <p className="text-text-dim">{resource.summary}</p>}
        </div>

        <div className="panel overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border-subtle">
            <span className="text-xs uppercase tracking-wide text-text-dim">Prompt</span>
            <CopyButton text={resource.body} />
          </div>
          <pre className="p-4 sm:p-5 whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed text-text">{resource.body}</pre>
        </div>

        {(resource.videoUrl || resource.link) && (
          <div className="flex flex-wrap gap-3">
            {resource.videoUrl && (
              <a href={resource.videoUrl} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-sm hover:border-accent-cyan/40">
                <PlayCircle size={15} /> Watch the video
              </a>
            )}
            {resource.link && (
              <a href={resource.link} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-sm hover:border-accent-cyan/40">
                <ExternalLink size={15} /> Open link
              </a>
            )}
          </div>
        )}

        {(resource.keywords ?? []).length > 0 && (
          <p className="text-sm text-text-dim">
            Tip: comment <span className="text-accent-cyan font-medium">{resource.keywords[0]}</span> on my videos and I'll send this straight to you.
          </p>
        )}

        {settings.newsletterEnabled && <NewsletterForm source={resource.slug} />}
      </main>
      <PublicFooter settings={settings} />
    </div>
  );
}
