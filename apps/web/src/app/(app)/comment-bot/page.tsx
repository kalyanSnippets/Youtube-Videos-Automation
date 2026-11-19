import { listConnections, loadPromptLibrary, recentComments, replyStats, resolveLLM } from "@yaos/comment-bot";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";
import { TestReplyForm } from "./test-form";
import { retryFailedComments } from "@/lib/actions/comment-bot";

const STATUS_VARIANT = { REPLIED: "success", SKIPPED: "default", FAILED: "danger", PROCESSING: "cyan", DRY_RUN: "purple" } as const;

function EnvRow({ name, hint }: { name: string; hint: string }) {
  const set = Boolean(process.env[name]);
  return (
    <li className="flex items-start gap-3 py-1.5">
      <Badge variant={set ? "success" : "warning"}>{set ? "set" : "missing"}</Badge>
      <div>
        <code className="text-xs">{name}</code>
        <p className="text-xs text-text-dim">{hint}</p>
      </div>
    </li>
  );
}

export default async function CommentBotPage() {
  const [connections, library, comments, stats] = await Promise.all([
    listConnections().catch(() => []),
    loadPromptLibrary(),
    recentComments(50).catch(() => []),
    replyStats().catch(() => ({}) as Record<string, number>),
  ]);
  const llm = resolveLLM();
  const yt = connections.find((c) => c.platform === "YOUTUBE");
  const ig = connections.find((c) => c.platform === "INSTAGRAM");
  const paused = /^(1|true|yes)$/i.test(process.env.COMMENT_BOT_PAUSED ?? "");
  const dryRun = /^(1|true|yes)$/i.test(process.env.COMMENT_BOT_DRY_RUN ?? "");
  const igDays = ig?.accessTokenExpiresAt ? Math.round((ig.accessTokenExpiresAt.getTime() - Date.now()) / 86_400_000) : null;

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px]">
          <h1 className="text-xl font-semibold mb-1">Comment Bot</h1>
          <p className="text-sm text-text-dim">
            Replies to YouTube and Instagram comments automatically. Keywords from your <a className="text-accent-cyan" href="/resources">Resources</a> get
            the prompt and its page link (by DM on Instagram); other comments get a short AI answer. Setup guide: <code>docs/SETUP.md</code>.
          </p>
        </div>
        {paused && <Badge variant="warning">Paused</Badge>}
        {dryRun && <Badge variant="purple">Dry run: nothing is posted</Badge>}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="panel p-5 space-y-2">
          <p className="text-xs uppercase tracking-wide text-text-dim">YouTube</p>
          {yt ? (
            <>
              <p className="font-medium">{yt.accountName}</p>
              <Badge variant="success">Connected</Badge>
              <p className="text-xs text-text-dim">Checked every minute.</p>
            </>
          ) : (
            <Badge variant="warning">Not connected</Badge>
          )}
          <ConnectForm action="/api/comment-bot/youtube/connect" label={yt ? "Reconnect YouTube" : "Connect YouTube"} />
        </div>
        <div className="panel p-5 space-y-2">
          <p className="text-xs uppercase tracking-wide text-text-dim">Instagram</p>
          {ig ? (
            <>
              <p className="font-medium">{ig.accountName}</p>
              <Badge variant={igDays !== null && igDays < 5 ? "warning" : "success"}>Connected</Badge>
              {(ig.metadata as { mode?: string } | null)?.mode === "unified" ? (
                <p className="text-xs text-text-dim">Unified login: the connection doesn't expire.</p>
              ) : (
                igDays !== null && <p className="text-xs text-text-dim">Token renews itself; {igDays} days left.</p>
              )}
            </>
          ) : (
            <Badge variant="warning">Not connected</Badge>
          )}
          <ConnectForm action="/api/comment-bot/instagram/connect" label={ig ? "Reconnect Instagram" : "Connect Instagram"} />
        </div>
        <div className="panel p-5 space-y-2">
          <p className="text-xs uppercase tracking-wide text-text-dim">Last 24 hours</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {(["REPLIED", "SKIPPED", "FAILED", "DRY_RUN"] as const).map((s) => (
              <div key={s}>
                <p className="text-lg font-semibold">{stats[s] ?? 0}</p>
                <p className="text-xs text-text-dim">{s.replace("_", " ").toLowerCase()}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-text-dim">AI: {llm ? llm.name : "none (keywords only)"}</p>
        </div>
      </div>

      <section className="panel p-5 space-y-3">
        <h2 className="text-sm font-semibold text-text-dim uppercase tracking-wide">Keywords the bot listens for</h2>
        {library.entries.length ? (
          <div className="flex flex-wrap gap-2">
            {library.entries.map((e) => (
              <Badge key={e.keyword} variant="cyan">
                {e.keywords.join(" / ")} · {e.title}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-dim">No keywords found yet.</p>
        )}
        {library.warnings.map((w) => (
          <p key={w} className="text-xs text-status-warning">{w}</p>
        ))}
      </section>

      <section className="panel p-5 space-y-3">
        <h2 className="text-sm font-semibold text-text-dim uppercase tracking-wide">Test a reply</h2>
        <TestReplyForm />
      </section>

      {(stats.FAILED ?? 0) > 0 || comments.some((c) => c.status === "FAILED") ? (
        <form action={retryFailedComments} className="flex flex-wrap items-center gap-3">
          <button className="rounded-lg border border-status-danger/40 text-status-danger px-3.5 py-2 text-sm hover:bg-status-danger/10">Retry failed comments</button>
          <span className="text-xs text-text-dim">They are picked up again within about a minute.</span>
        </form>
      ) : null}

      <section className="panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-text-dim border-b border-border-subtle">
              <th className="p-3 font-medium">When</th>
              <th className="p-3 font-medium">Where</th>
              <th className="p-3 font-medium">Comment</th>
              <th className="p-3 font-medium">Bot reply</th>
              <th className="p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {comments.map((c) => (
              <tr key={c.id} className="align-top">
                <td className="p-3 text-text-dim whitespace-nowrap">{formatRelativeTime(c.createdAt)}</td>
                <td className="p-3 text-text-dim">{c.platform === "YOUTUBE" ? "YouTube" : "Instagram"}</td>
                <td className="p-3 max-w-xs">
                  <p className="text-xs text-text-dim">{c.authorName}</p>
                  <p className="line-clamp-3">{c.commentText}</p>
                </td>
                <td className="p-3 max-w-sm text-text-dim">
                  {c.privateReply && <p className="line-clamp-2"><span className="text-text">DM:</span> {c.privateReply}</p>}
                  {c.publicReply && <p className="line-clamp-3">{c.publicReply}</p>}
                  {c.skipReason && <p className="text-xs">{c.skipReason}</p>}
                  {c.error && <p className="text-xs text-status-danger">{c.error}</p>}
                </td>
                <td className="p-3">
                  <Badge variant={STATUS_VARIANT[c.status as keyof typeof STATUS_VARIANT] ?? "default"}>{c.status}</Badge>
                  {c.matchedKeyword && <p className="text-xs text-text-dim mt-1">{c.matchedKeyword}</p>}
                </td>
              </tr>
            ))}
            {comments.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-text-dim">No comments handled yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="panel p-5">
        <h2 className="text-sm font-semibold text-text-dim uppercase tracking-wide mb-2">Settings checklist</h2>
        <ul className="grid gap-x-6 md:grid-cols-2">
          <EnvRow name="DATABASE_URL" hint="Supabase connection string (Transaction pooler)." />
          <EnvRow name="APP_SECRET" hint="Random 32+ character secret: signs your login and protects the scheduled job." />
          <EnvRow name="ADMIN_EMAILS" hint="Your Google email; only this account can sign in." />
          <EnvRow name="GEMINI_API_KEY" hint="Free key from aistudio.google.com for AI answers (or ANTHROPIC_API_KEY / OPENAI_API_KEY)." />
          <EnvRow name="GOOGLE_CLIENT_ID" hint="Google Cloud OAuth client for YouTube." />
          <EnvRow name="GOOGLE_CLIENT_SECRET" hint="Google Cloud OAuth client secret." />
          <EnvRow name="INSTAGRAM_APP_ID" hint="Meta app → App settings → Basic → App ID." />
          <EnvRow name="INSTAGRAM_APP_SECRET" hint="Meta app → App settings → Basic → App secret. Also used to verify webhooks." />
          <EnvRow name="META_LOGIN_CONFIG_ID" hint="Meta app → Facebook Login for Business → Configurations → Configuration ID (Unified login)." />
          <EnvRow name="INSTAGRAM_WEBHOOK_VERIFY_TOKEN" hint="Any random word; paste the same value in Meta's webhook settings." />
        </ul>
      </section>
    </div>
  );
}

function ConnectForm({ action, label }: { action: string; label: string }) {
  return (
    <a href={action} className="inline-block rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-bg-raised">
      {label}
    </a>
  );
}
