import { normaliseTemplates } from "@yaos/comment-bot";
import { getSiteSettings } from "@/lib/site";
import { TemplatesForm } from "./templates-form";

export const dynamic = "force-dynamic";

export default async function ReplyTemplatesPage() {
  const settings = await getSiteSettings();
  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div>
        <a href="/comment-bot" className="text-sm text-text-dim hover:text-text">← Comment Bot</a>
        <h1 className="text-xl font-semibold mt-2 mb-1">Reply messages</h1>
        <p className="text-sm text-text-dim">
          Choose what the bot says when someone comments a keyword, and how its AI answers sound. Use a template or write your own.
        </p>
      </div>
      <TemplatesForm initial={normaliseTemplates(settings.botTemplates)} />
    </div>
  );
}
