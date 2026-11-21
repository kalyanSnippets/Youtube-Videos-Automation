import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { ArrowLeft, Download, ExternalLink, FileText } from "lucide-react";
import { db, ensureSchemaPatches, schema } from "@yaos/database";
import { getFollowLinks, getSiteSettings } from "@/lib/site";
import { FollowCta } from "@/components/public/follow-cta";
import { PublicFooter, PublicHeader } from "@/components/public/site-chrome";
import { CopyButton } from "@/components/public/copy-button";
import { NewsletterForm } from "@/components/public/newsletter-form";
import { videoDetailParts, videoKind } from "@/lib/video-details";

function fileSize(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** The full description, with links made clickable. */
function Description({ text }: { text: string }) {
  const parts = text.trim().split(/(https?:\/\/[^\s]+)/g);
  return (
    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-text-dim">
      {parts.map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a key={i} href={part} target="_blank" rel="noopener nofollow" className="text-accent-cyan hover:underline">
            {part}
          </a>
        ) : (
          part
        ),
      )}
    </p>
  );
}

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
  const details = videoDetailParts(video);

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
            <span className="badge border bg-bg-raised text-text-dim border-border">{videoKind(video)}</span>
            {details.length > 0 && <span className="tabular-nums">{details.join(" · ")}</span>}
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

        {video.attachmentName && (
          <section className="panel p-4 sm:p-5 flex flex-wrap items-center gap-4 border-accent-cyan/30">
            <FileText size={28} className="shrink-0 text-accent-cyan" />
            <div className="min-w-0 flex-1">
              <p className="font-medium break-words">{video.resourceTitle || video.attachmentName}</p>
              <p className="text-xs text-text-dim break-words">
                {video.attachmentName}
                {video.attachmentSize ? ` · ${fileSize(video.attachmentSize)}` : ""}
              </p>
            </div>
            <a
              href={`/v/${video.slug}/file`}
              className="inline-flex items-center gap-2 rounded-lg bg-accent-cyan text-bg font-medium text-sm px-4 py-2.5 hover:brightness-110"
            >
              <Download size={15} /> Download
            </a>
          </section>
        )}

        {video.prompt && video.attachmentName && (
          <details className="panel overflow-hidden group">
            <summary className="cursor-pointer px-4 py-3 text-sm text-text-dim hover:text-text">Show the text version</summary>
            <div className="flex justify-end px-4 pb-2"><CopyButton text={video.prompt} /></div>
            <pre className="px-4 pb-5 sm:px-5 whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed text-text">{video.prompt}</pre>
          </details>
        )}

        {video.prompt && !video.attachmentName && (
          <section className="panel overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border-subtle">
              <span className="text-sm font-medium">{video.resourceTitle || "Prompt from this video"}</span>
              <CopyButton text={video.prompt} />
            </div>
            <pre className="p-4 sm:p-5 whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed text-text">{video.prompt}</pre>
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

        {video.description?.trim() && (
          <section className="panel p-5 space-y-2">
            <h2 className="text-sm font-semibold">About this {video.platform === "YOUTUBE" ? "video" : "post"}</h2>
            <Description text={video.description} />
          </section>
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
