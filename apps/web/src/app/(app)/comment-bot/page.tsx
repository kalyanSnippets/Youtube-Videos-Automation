import { listConnections, recentComments, replyStats, resolveLLM, type CommentRow } from "@yaos/comment-bot";
import { formatRelativeTime } from "@/lib/utils";
import { BotHeader } from "./bot-header";
import { RowSend, SendProgress, type PendingComment } from "./send-progress";

export const dynamic = "force-dynamic";

const STUCK_MS = 60_000;

function isStuck(c: CommentRow): boolean {
  return c.status === "PROCESSING" && Date.now() - c.updatedAt.getTime() > STUCK_MS;
}

function statusPill(c: CommentRow): { label: string; className: string } {
  if (isStuck(c)) return { label: "Stuck", className: "bg-status-danger/10 text-status-danger border-status-danger/30" };
  switch (c.status) {
    case "REPLIED":
      return { label: "Replied", className: "bg-status-success/10 text-status-success border-status-success/30" };
    case "FAILED":
      return { label: "Failed", className: "bg-status-danger/10 text-status-danger border-status-danger/30" };
    case "SKIPPED":
      return { label: "No reply", className: "bg-bg-raised text-text-dim border-border" };
    case "DRY_RUN":
      return { label: "Dry run", className: "bg-accent-purple/10 text-accent-purple border-accent-purple/30" };
    default:
      return { label: "Sending…", className: "bg-accent-cyan/10 text-accent-cyan border-accent-cyan/30" };
  }
}

function whatHappened(c: CommentRow): string | null {
  switch (c.action) {
    case "KEYWORD":
      return `Sent the ${c.matchedKeyword} prompt`;
    case "KEYWORD_AND_ANSWER":
      return `Answered and sent the ${c.matchedKeyword} prompt`;
    case "AI_ANSWER":
      return "Answered the question";
    case "GENERAL":
      return "Said thanks";
    default:
      return null;
  }
}

function toPending(c: CommentRow): PendingComment {
  return { id: c.id, platform: c.platform, author: c.authorName, text: c.commentText, status: isStuck(c) ? "FAILED" : c.status };
}

export default async function CommentBotActivityPage() {
  const [connections, comments, stats] = await Promise.all([
    listConnections().catch(() => []),
    recentComments(60).catch(() => [] as CommentRow[]),
    replyStats().catch(() => ({}) as Record<string, number>),
  ]);
  const llm = resolveLLM();
  const yt = connections.find((c) => c.platform === "YOUTUBE");
  const ig = connections.find((c) => c.platform === "INSTAGRAM");
  const needsRetry = comments.filter((c) => c.status === "FAILED" || isStuck(c));

  const chip = (ok: boolean, label: string) => (
    <span className={`badge border ${ok ? "bg-status-success/10 text-status-success border-status-success/30" : "bg-status-warning/10 text-status-warning border-status-warning/30"}`}>
      {ok ? "✓" : "!"} {label}
    </span>
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl">
      <BotHeader subtitle="Every comment the bot saw, what it replied, and anything that needs a retry." />

      <div className="flex flex-wrap items-center gap-2 text-sm">
        {chip(Boolean(yt), yt ? `YouTube: ${yt.accountName}` : "YouTube not connected")}
        {chip(Boolean(ig), ig ? `Instagram: ${ig.accountName}` : "Instagram not connected")}
        {chip(Boolean(llm), llm ? "AI replies on" : "AI off (no key)")}
        <span className="w-full sm:w-auto sm:ml-auto text-text-dim">
          Last 24 hours: <span className="text-text font-medium">{stats.REPLIED ?? 0}</span> replied · {stats.SKIPPED ?? 0} no reply ·{" "}
          <span className={stats.FAILED ? "text-status-danger" : ""}>{stats.FAILED ?? 0} failed</span>
        </span>
      </div>

      {needsRetry.length > 0 && <SendProgress label={`Retry ${needsRetry.length} failed`} items={needsRetry.map(toPending)} />}

      <section className="panel divide-y divide-border-subtle overflow-hidden">
        {comments.map((c) => {
          const pill = statusPill(c);
          const what = whatHappened(c);
          const canSend = c.status === "FAILED" || c.status === "SKIPPED" || c.status === "DRY_RUN" || isStuck(c);
          return (
            <div key={c.id} className="p-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <div className="min-w-0">
                <p className="text-xs text-text-dim">
                  {c.platform === "YOUTUBE" ? "YouTube" : "Instagram"} · {c.authorName ?? "viewer"} · {formatRelativeTime(c.createdAt)}
                </p>
                <p className="mt-1 text-sm line-clamp-3">“{c.commentText}”</p>
              </div>
              <div className="min-w-0 text-sm text-text-dim">
                {what && <p className="text-xs font-medium text-text">{what}</p>}
                {c.privateReply && <p className="mt-1 line-clamp-2"><span className="text-text">DM:</span> {c.privateReply}</p>}
                {c.publicReply && <p className="mt-1 line-clamp-3"><span className="text-text">Reply:</span> {c.publicReply}</p>}
                {c.status === "SKIPPED" && c.skipReason && <p className="mt-1 text-xs">Why no reply: {c.skipReason}</p>}
                {c.error && (c.status === "FAILED" || isStuck(c)) && <p className="mt-1 text-xs text-status-danger">{c.error}</p>}
                {isStuck(c) && !c.error && <p className="mt-1 text-xs text-status-danger">The server stopped before the reply was sent. Click Retry.</p>}
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:block sm:text-right">
                <span className={`badge border ${pill.className}`}>{pill.label}</span>
                {canSend && <RowSend item={toPending(c)} />}
              </div>
            </div>
          );
        })}
        {comments.length === 0 && <p className="p-4 sm:p-6 text-center text-sm text-text-dim">No comments yet. New comments show up here within a minute.</p>}
      </section>
    </div>
  );
}
