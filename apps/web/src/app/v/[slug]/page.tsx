import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getAttachmentHtml, getPublicSettings, getPublicVideo, getTextResourceHtml } from "@/lib/public-data";
import { FollowCta } from "@/components/public/follow-cta";
import { PublicFooter, PublicHeader } from "@/components/public/site-chrome";
import { NewsletterForm } from "@/components/public/newsletter-form";
import { ResourceViewer } from "@/components/public/resource-viewer";
import { ViewPing } from "@/components/public/view-ping";
import { videoDetailParts, videoKind } from "@/lib/video-details";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const v = await getPublicVideo((await params).slug).catch(() => null);
  return v ? { title: v.title, description: v.description?.slice(0, 160) ?? undefined } : { title: "Not found" };
}

function fileSize(bytes: number | null): string | null {
  if (!bytes) return null;
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

export default async function VideoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Both cached (lib/public-data.ts): no database trip unless something changed.
  const [video, settings] = await Promise.all([getPublicVideo(slug), getPublicSettings()]);
  if (!video) notFound();
  const watchLabel = video.platform === "YOUTUBE" ? "Watch on YouTube" : "View on Instagram";
  const details = videoDetailParts(video);
  const portrait = video.format === "SHORT" || video.format === "REEL";

  // What to show: the uploaded document as it looks (PDF drawn page by page, Word/Markdown formatted),
  // a pasted resource laid out as a document, or a prompt in a copy box.
  const name = video.resourceTitle || video.attachment?.name.replace(/\.[a-z0-9]+$/i, "").replace(/[_-]+/g, " ") || (video.kind === "prompt" ? "Prompt from this video" : "Resource from this video");
  let viewer: React.ReactNode = null;
  if (video.attachment) {
    const url = `/v/${video.slug}/file`;
    const download = { url, name: video.attachment.name, size: fileSize(video.attachment.size) };
    if (video.attachment.name.toLowerCase().endsWith(".pdf")) {
      viewer = <ResourceViewer title={name} kind={video.kind} body={{ type: "pdf", url }} download={download} />;
    } else {
      const html = await getAttachmentHtml(video.id).catch(() => null);
      viewer = html ? (
        <ResourceViewer title={name} kind={video.kind} body={{ type: "html", html }} download={download} />
      ) : video.prompt ? (
        <ResourceViewer title={name} kind={video.kind} body={{ type: "prompt", text: video.prompt }} download={download} />
      ) : null;
    }
  } else if (video.prompt?.trim()) {
    viewer =
      video.kind === "resource" ? (
        <ResourceViewer title={name} kind="resource" body={{ type: "html", html: await getTextResourceHtml(video.id, video.prompt) }} />
      ) : (
        <ResourceViewer title={name} kind="prompt" body={{ type: "prompt", text: video.prompt }} />
      );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader settings={settings} />
      <ViewPing slug={video.slug} />
      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-8 sm:py-12 space-y-6">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-text-dim hover:text-text">
          <ArrowLeft size={14} /> All videos and resources
        </Link>

        <div className="flex gap-4 items-start">
          <a
            href={video.watchUrl}
            target="_blank"
            rel="noopener"
            className={`relative shrink-0 overflow-hidden rounded-xl border border-border bg-bg-raised ${portrait ? "w-24 sm:w-32 aspect-[9/16]" : "w-40 sm:w-56 aspect-video"}`}
          >
            <Image src={video.thumb} alt="" fill sizes="224px" className="object-cover" unoptimized priority />
          </a>
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-text-dim">
              <span className="badge border bg-bg-raised text-text-dim border-border">{videoKind(video)}</span>
              {details.length > 0 && <span className="tabular-nums">{details.join(" · ")}</span>}
            </div>
            <h1 className="text-xl sm:text-3xl font-semibold tracking-tight">{video.title}</h1>
            <a
              href={video.watchUrl}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3.5 py-2 text-sm hover:border-accent-cyan/40"
            >
              <ExternalLink size={15} /> {watchLabel}
            </a>
          </div>
        </div>

        {video.keyword && video.hasContent && (
          <p className="text-sm text-text-dim">
            Tip: comment <span className="text-accent-cyan font-medium">{video.keyword.split(",")[0]!.trim()}</span> on the{" "}
            {video.platform === "YOUTUBE" ? "video" : "post"} and I&apos;ll send this to you.
          </p>
        )}

        {viewer}

        {video.extraLink && (
          <a href={video.extraLink} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-sm hover:border-accent-cyan/40">
            <ExternalLink size={15} /> Open the link from this video
          </a>
        )}

        {video.fullDescription?.trim() && (
          <section className="panel p-5 space-y-2">
            <h2 className="text-sm font-semibold">About this {video.platform === "YOUTUBE" ? "video" : "post"}</h2>
            <Description text={video.fullDescription} />
          </section>
        )}

        <section className="panel p-5 space-y-3">
          <p className="font-semibold">Enjoyed this? Get the next one first.</p>
          <FollowCta links={settings.follow} />
        </section>

        {settings.newsletterEnabled && <NewsletterForm source={video.slug} />}
      </main>
      <PublicFooter settings={settings} />
    </div>
  );
}
