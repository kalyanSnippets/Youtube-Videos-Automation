import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@yaos/database";
import { getFollowLinks, getSiteSettings, listResources } from "@/lib/site";
import { FollowCta } from "@/components/public/follow-cta";
import { PublicFooter, PublicHeader } from "@/components/public/site-chrome";
import { ChannelBrowser } from "@/components/public/channel-browser";
import type { GridItem } from "@/components/public/resource-grid";
import { NewsletterForm } from "@/components/public/newsletter-form";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings().catch(() => null);
  return { title: s ? `${s.siteName} · Free AI prompts` : "Free AI prompts", description: s?.tagline };
}

type VideoRow = typeof schema.videos.$inferSelect;

function toItem(v: VideoRow): GridItem {
  return {
    href: `/v/${v.slug}`,
    title: v.title,
    summary: v.description ? v.description.split("\n").find((l) => l.trim())?.slice(0, 160) ?? null : null,
    keywords: v.keyword && v.prompt ? [v.keyword] : [],
    thumbnail: `/api/thumb/${v.id}`,
    badge: v.prompt ? "Prompt ready" : "Prompt coming soon",
    badgeTone: v.prompt ? "cyan" : "dim",
    meta: v.publishedAt ? new Date(v.publishedAt).toLocaleDateString() : undefined,
  };
}

export default async function HomePage() {
  const [settings, resources, videos] = await Promise.all([
    getSiteSettings(),
    listResources({ publishedOnly: true }),
    db.select().from(schema.videos).where(eq(schema.videos.hidden, false)).orderBy(desc(schema.videos.publishedAt)).catch(() => [] as VideoRow[]),
  ]);
  const followLinks = await getFollowLinks(settings);
  const yt = videos.filter((v) => v.platform === "YOUTUBE");
  const ig = videos.filter((v) => v.platform === "INSTAGRAM");

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader settings={settings} />
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-10 sm:py-14 space-y-10">
        <section className="space-y-3 max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Free prompts from <span className="bg-gradient-to-r from-accent-cyan to-accent-purple bg-clip-text text-transparent">{settings.siteName}</span>
          </h1>
          <p className="text-text-dim">{settings.tagline}</p>
          <div className="pt-2">
            <FollowCta links={followLinks} />
          </div>
        </section>
        <ChannelBrowser
          data={{
            youtube: {
              // Not yet classified (format null) counts as a normal video until the next sync sorts it.
              long: yt.filter((v) => v.format !== "SHORT").map(toItem),
              shorts: yt.filter((v) => v.format === "SHORT").map(toItem),

            },
            instagram: {
              reels: ig.filter((v) => v.format === "REEL").map(toItem),
              posts: ig.filter((v) => v.format !== "REEL").map(toItem),

            },
            prompts: resources.map((r) => ({ href: `/r/${r.slug}`, title: r.title, summary: r.summary, keywords: r.keywords ?? [] })),
          }}
        />
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
