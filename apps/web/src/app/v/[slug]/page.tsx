import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { db, ensureSchemaPatches, schema } from "@yaos/database";
import { getFollowLinks, getSiteSettings } from "@/lib/site";
import { FollowCta } from "@/components/public/follow-cta";
import { PublicFooter, PublicHeader } from "@/components/public/site-chrome";
import { CopyButton } from "@/components/public/copy-button";
import { NewsletterForm } from "@/components/public/newsletter-form";

export const dynamic = "force-dynamic";

async function getVideo(slug: string) {
  await ensureSchemaPatches();
  const [v] = await db.select().from(schema.videos).where(and(eq(schema.videos.slug, slug), eq(schema.videos.hidden, false)));
  return v ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const v = await getVideo((await params).slug).catch(() => null);
  return v ? { title: v.title } : { title: "Not found" };
}

export default async function VideoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [video, settings] = await Promise.all([getVideo(slug), getSiteSettings()]);
  if (!video) notFound();
  // Best-effort visit counter (shown on the Analytics page); never blocks the page.
  db.update(schema.videos).set({ pageViews: sql`${schema.videos.pageViews} + 1` }).where(eq(schema.videos.id, video.id)).catch(() => undefined);
  const watchLabel = video.platform === "YOUTUBE" ? "Watch on YouTube" : "View on Instagram";
  const date = video.publishedAt ? new Date(video.publishedAt).toLocaleDateString() : null;

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader settings={settings} />
      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-8 sm:py-12 space-y-6">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-text-dim hover:text-text">
          <ArrowLeft size={14} /> All videos and prompts
        </Link>

        <div
          className={`relative overflow-hidden rounded-2xl border border-border bg-bg-raised ${
            video.format === "SHORT" || video.format === "REEL" ? "aspect-[9/16] max-w-xs" : video.platform === "INSTAGRAM" ? "aspect-square max-w-md" : "aspect-video"
          }`}
        >
          <Image src={`/api/thumb/${video.id}`} alt="" fill sizes="(min-width: 768px) 768px, 100vw" className="object-cover" unoptimized priority />
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-text-dim">
            <span className="badge border bg-bg-raised text-text-dim border-border">
              {video.platform === "YOUTUBE" ? (video.format === "SHORT" ? "YouTube Short" : "YouTube") : video.format === "REEL" ? "Instagram Reel" : "Instagram post"}
            </span>
            {date && <span>{date}</span>}
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{video.title}</h1>
        </div>

        <a
          href={video.watchUrl}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-2 rounded-lg bg-accent-cyan text-bg font-medium text-sm px-4 py-2.5 hover:brightness-110"
        >
          <ExternalLink size={15} /> {watchLabel}
        </a>

        {video.prompt ? (
          <section className="panel overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border-subtle">
              <span className="text-sm font-medium">{video.resourceTitle || "Prompt from this video"}</span>
              <CopyButton text={video.prompt} />
            </div>
            <pre className="p-4 sm:p-5 whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed text-text">{video.prompt}</pre>
          </section>
        ) : (
          <section className="panel p-5 text-sm text-text-dim">
            The prompt for this video is coming soon. Watch the video for now, and check back here.
          </section>
        )}

        {video.extraLink && (
          <a href={video.extraLink} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-sm hover:border-accent-cyan/40">
            <ExternalLink size={15} /> Open the link from this video
          </a>
        )}

        {video.keyword && video.prompt && (
          <p className="text-sm text-text-dim">
            Tip: comment <span className="text-accent-cyan font-medium">{video.keyword}</span> on the {video.platform === "YOUTUBE" ? "video" : "post"} and I&apos;ll send this to you.
          </p>
        )}

        <section className="panel p-5 space-y-3">
          <p className="font-semibold">Enjoyed this? Get the next one first.</p>
          <FollowCta links={await getFollowLinks(settings)} />
        </section>

        {settings.newsletterEnabled && <NewsletterForm source={video.slug} />}
      </main>
      <PublicFooter settings={settings} />
    </div>
  );
}
