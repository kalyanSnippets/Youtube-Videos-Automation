import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@yaos/database";
import { PACKAGE_INSTRUCTIONS, splitKeywords } from "@yaos/comment-bot";
import { deletePlannedPostAction, linkPlannedPostAction } from "@/lib/actions/packages";
import { listPlannedPosts } from "@/lib/upload-packages";
import { cleanTitle } from "@/lib/video-match";
import { videoKind } from "@/lib/video-details";
import { inputClass } from "@/components/form-fields";
import { CopyButton } from "@/components/public/copy-button";
import { ImportForm } from "./import-form";

export const dynamic = "force-dynamic";

export default async function UploadPackagesPage() {
  const [posts, videos] = await Promise.all([
    listPlannedPosts(),
    db.select().from(schema.videos).where(eq(schema.videos.hidden, false)).orderBy(desc(schema.videos.publishedAt)).catch(() => []),
  ]);
  const byId = new Map(videos.map((v) => [v.id, v]));

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl">
      <div>
        <Link href="/videos" className="text-sm text-text-dim hover:text-text">← Videos & prompts</Link>
        <h1 className="mt-2 text-xl font-semibold">Upload packages</h1>
        <p className="mt-1 text-sm text-text-dim">
          Import Claude&apos;s upload package once. For every video that says &ldquo;Comment WORD and I&apos;ll send you…&rdquo;, the app remembers the
          keyword and the prompt. When that video goes live on YouTube or Instagram, its card is filled in and its bot is switched on, within an
          hour, with nothing to type.
        </p>
      </div>

      <ImportForm />

      <section className="space-y-3">
        <h2 className="font-semibold">Imported videos</h2>
        {posts.length === 0 && <p className="panel p-5 text-sm text-text-dim">Nothing imported yet.</p>}
        <div className="panel divide-y divide-border-subtle overflow-hidden">
          {posts.map((p) => {
            const matched = p.matchedVideoIds.map((id) => byId.get(id)).filter((v): v is NonNullable<typeof v> => Boolean(v));
            return (
              <div key={p.id} className="p-4 space-y-2">
                <div className="flex flex-wrap items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{p.label}</p>
                    <p className="text-xs text-text-dim">
                      Keyword <span className="text-accent-cyan font-medium">{splitKeywords(p.keywords).join(", ")}</span>
                      {p.promptName && <> · sends &ldquo;{p.promptName}&rdquo;</>}
                    </p>
                  </div>
                  {matched.length ? (
                    <span className="badge border bg-status-success/10 text-status-success border-status-success/30">✓ Set up</span>
                  ) : (
                    <span className="badge border bg-bg-raised text-text-dim border-border">Waiting for the video</span>
                  )}
                </div>
                {matched.map((v) => (
                  <p key={v.id} className="text-xs text-text-dim">
                    ↳ {videoKind(v)}: <span className="text-text">{(cleanTitle(v.title) || v.title).slice(0, 80)}</span> · Bot {v.botEnabled ? "on" : "off"}
                  </p>
                ))}
                {p.note && <p className="text-xs text-text-faint">{p.note}</p>}
                <details className="text-xs">
                  <summary className="cursor-pointer text-text-dim hover:text-text">Prompt it sends · wrong video? pick it</summary>
                  <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-bg-raised p-3 whitespace-pre-wrap font-mono text-[12px]">{p.prompt}</pre>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <form action={linkPlannedPostAction} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="postId" value={p.id} />
                      <select name="videoId" defaultValue="" className={`${inputClass} w-full sm:w-auto sm:max-w-[320px] py-1.5 text-xs`}>
                        <option value="">Choose the video…</option>
                        {videos.map((v) => (
                          <option key={v.id} value={v.id}>
                            {videoKind(v)}: {(cleanTitle(v.title) || v.title).slice(0, 60)}
                          </option>
                        ))}
                      </select>
                      <button className="rounded-lg border border-border px-3 py-1.5 text-xs hover:border-accent-cyan/40">Use this video</button>
                    </form>
                    <form action={deletePlannedPostAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="text-xs text-status-danger hover:underline">Remove</button>
                    </form>
                  </div>
                </details>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel p-4 sm:p-5 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Tell Claude once</h2>
          <CopyButton text={PACKAGE_INSTRUCTIONS} label="Copy instructions" />
        </div>
        <p className="text-sm text-text-dim">
          Most packages import as they are. To make every future package import perfectly, paste this into your Claude project instructions (or
          at the start of the chat where Claude writes the package):
        </p>
        <pre className="rounded-lg bg-bg-raised p-3 whitespace-pre-wrap font-mono text-[12px] text-text-dim">{PACKAGE_INSTRUCTIONS}</pre>
      </section>
    </div>
  );
}
