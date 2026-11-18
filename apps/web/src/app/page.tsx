import type { Metadata } from "next";
import { getSiteSettings, listResources } from "@/lib/site";
import { PublicFooter, PublicHeader } from "@/components/public/site-chrome";
import { ResourceGrid } from "@/components/public/resource-grid";
import { NewsletterForm } from "@/components/public/newsletter-form";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings().catch(() => null);
  return { title: s ? `${s.siteName} · Free AI prompts` : "Free AI prompts", description: s?.tagline };
}

export default async function HomePage() {
  const [settings, resources] = await Promise.all([getSiteSettings(), listResources({ publishedOnly: true })]);
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader settings={settings} />
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-10 sm:py-14 space-y-10">
        <section className="space-y-3 max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Free prompts from <span className="bg-gradient-to-r from-accent-cyan to-accent-purple bg-clip-text text-transparent">{settings.siteName}</span>
          </h1>
          <p className="text-text-dim">{settings.tagline}</p>
        </section>
        <ResourceGrid resources={resources.map((r) => ({ slug: r.slug, title: r.title, summary: r.summary, keywords: r.keywords ?? [] }))} />
        {settings.newsletterEnabled && (
          <div className="max-w-xl">
            <NewsletterForm source="home" />
          </div>
        )}
      </main>
      <PublicFooter settings={settings} />
    </div>
  );
}
