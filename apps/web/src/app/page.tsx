import type { Metadata } from "next";
import { getPublicResources, getPublicSettings, getPublicVideos, type PublicVideoCard } from "@/lib/public-data";
import { FollowCta } from "@/components/public/follow-cta";
import { PublicFooter, PublicHeader } from "@/components/public/site-chrome";
import { ChannelBrowser } from "@/components/public/channel-browser";
import type { GridItem } from "@/components/public/resource-grid";
import { NewsletterForm } from "@/components/public/newsletter-form";
import { descriptionSummary, videoDetailParts } from "@/lib/video-details";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getPublicSettings().catch(() => null);
  return { title: s ? `${s.siteName} · Free AI prompts and resources` : "Free AI prompts and resources", description: s?.tagline };
}

function toItem(v: PublicVideoCard): GridItem {
  return {
    href: `/v/${v.slug}`,
    title: v.title,
    summary: descriptionSummary(v.description),
    keywords: v.keyword && v.hasContent ? [v.keyword.split(",")[0]!.trim()] : [],
    thumbnail: v.thumb,
    // Only videos with something to take away get a label; the rest just show their details.
    badge: v.hasContent ? (v.kind === "prompt" ? "Free prompt" : "Free resource") : undefined,
    badgeTone: v.kind === "prompt" ? "cyan" : "purple",
    meta: videoDetailParts(v).join(" · ") || undefined,
  };
}

export default async function HomePage() {
  // All three are cached (lib/public-data.ts): no database trip unless something changed.
  const [settings, resources, videos] = await Promise.all([getPublicSettings(), getPublicResources(), getPublicVideos()]);
  const yt = videos.filter((v) => v.platform === "YOUTUBE");
  const ig = videos.filter((v) => v.platform === "INSTAGRAM");

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader settings={settings} />
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-10 sm:py-14 space-y-10">
        <section className="space-y-3 max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Free prompts and resources from{" "}
            <span className="bg-gradient-to-r from-accent-cyan to-accent-purple bg-clip-text text-transparent">{settings.siteName}</span>
          </h1>
          <p className="text-text-dim">{settings.tagline}</p>
          <div className="pt-2">
            <FollowCta links={settings.follow} />
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
            prompts: resources.map((r) => ({ href: `/r/${r.slug}`, title: r.title, summary: r.summary, keywords: r.keywords })),
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
