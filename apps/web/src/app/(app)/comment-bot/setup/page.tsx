import { listConnections, loadPromptLibrary, resolveLLM } from "@yaos/comment-bot";
import { Badge } from "@/components/ui/badge";
import { BotHeader } from "../bot-header";

export const dynamic = "force-dynamic";

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

export default async function CommentBotSetupPage() {
  const [connections, library] = await Promise.all([listConnections().catch(() => []), loadPromptLibrary()]);
  const llm = resolveLLM();
  const yt = connections.find((c) => c.platform === "YOUTUBE");
  const ig = connections.find((c) => c.platform === "INSTAGRAM");
  const keywords = [...new Map(library.entries.map((e) => [e.keyword, e])).values()];

  const card = (title: string, conn: typeof yt, href: string, note: string) => (
    <div className="panel p-5 space-y-2">
      <p className="text-xs uppercase tracking-wide text-text-dim">{title}</p>
      {conn ? (
        <>
          <p className="font-medium">{conn.accountName}</p>
          <Badge variant="success">Connected</Badge>
          <p className="text-xs text-text-dim">{note}</p>
        </>
      ) : (
        <Badge variant="warning">Not connected</Badge>
      )}
      <a href={href} className="inline-block rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-bg-raised">
        {conn ? "Reconnect" : "Connect"} {title}
      </a>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl">
      <BotHeader subtitle="Connected accounts, the keywords the bot listens for, and the site's settings checklist." />

      <div className="grid gap-4 md:grid-cols-3">
        {card("YouTube", yt, "/api/comment-bot/youtube/connect", "New comments are checked every minute.")}
        {card("Instagram", ig, "/api/comment-bot/instagram/connect", "Comments arrive instantly. The connection doesn't expire.")}
        <div className="panel p-5 space-y-2">
          <p className="text-xs uppercase tracking-wide text-text-dim">AI</p>
          <p className="font-medium">{llm ? llm.name : "Not set up"}</p>
          <Badge variant={llm ? "success" : "warning"}>{llm ? "On" : "Off"}</Badge>
          <p className="text-xs text-text-dim">{llm ? "Answers questions and general comments." : "Only keyword comments get replies. Add GEMINI_API_KEY in Netlify."}</p>
        </div>
      </div>

      <section className="panel p-5 space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-text-dim uppercase tracking-wide">Keywords the bot listens for</h2>
          <p className="text-xs text-text-dim mt-1">Add or change these on Videos & prompts (each video's keyword).</p>
        </div>
        {keywords.length ? (
          <div className="flex flex-wrap gap-2">
            {keywords.map((e) => (
              <Badge key={e.keyword} variant="cyan">
                {e.keyword} · {e.title}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-dim">No keywords yet. Add a prompt and keyword to a video.</p>
        )}
        {library.warnings.map((w) => (
          <p key={w} className="text-xs text-status-warning">{w}</p>
        ))}
      </section>

      <section className="panel p-5">
        <h2 className="text-sm font-semibold text-text-dim uppercase tracking-wide mb-2">Netlify settings checklist</h2>
        <ul className="grid gap-x-6 md:grid-cols-2">
          <EnvRow name="DATABASE_URL" hint="Supabase connection string (Transaction pooler)." />
          <EnvRow name="APP_SECRET" hint="Signs your login and protects the scheduled jobs." />
          <EnvRow name="ADMIN_EMAILS" hint="Your Google email; only this account can sign in." />
          <EnvRow name="GEMINI_API_KEY" hint="Free key from aistudio.google.com for AI answers." />
          <EnvRow name="GOOGLE_CLIENT_ID" hint="Google Cloud OAuth client (login + YouTube)." />
          <EnvRow name="GOOGLE_CLIENT_SECRET" hint="Google Cloud OAuth client secret." />
          <EnvRow name="INSTAGRAM_APP_ID" hint="Meta app → App settings → Basic → App ID." />
          <EnvRow name="INSTAGRAM_APP_SECRET" hint="Meta app → App settings → Basic → App secret." />
          <EnvRow name="META_LOGIN_CONFIG_ID" hint="Meta app → Unified login configuration ID." />
          <EnvRow name="INSTAGRAM_WEBHOOK_VERIFY_TOKEN" hint="The word you typed in Meta's webhook settings." />
        </ul>
      </section>
    </div>
  );
}
