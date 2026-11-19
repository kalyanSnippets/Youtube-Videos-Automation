import { normaliseTemplates } from "@yaos/comment-bot";
import { getSiteSettings } from "@/lib/site";
import { TemplatesForm } from "./templates-form";
import { BotHeader } from "../bot-header";

export const dynamic = "force-dynamic";

export default async function ReplyTemplatesPage() {
  const settings = await getSiteSettings();
  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl">
      <BotHeader subtitle="Choose what the bot says. Pick a ready-made style or write your own, and check the preview." />
      <section className="panel p-5 space-y-3">
        <h2 className="font-semibold">How replies work</h2>
        <div className="grid gap-3 md:grid-cols-3 text-sm">
          <div className="panel-raised p-3 space-y-1">
            <p className="font-medium">1. Keyword comments</p>
            <p className="text-text-dim">“FABLE” on a video with that keyword. Instagram: the prompt goes by <b>DM</b> and a short public reply says it&apos;s sent. YouTube: the prompt is the public reply (YouTube has no DMs).</p>
          </div>
          <div className="panel-raised p-3 space-y-1">
            <p className="font-medium">2. Questions</p>
            <p className="text-text-dim">“What mic do you use?” The AI answers in your style, using your About-me notes (Settings → Website). It never invents facts or adds links.</p>
          </div>
          <div className="panel-raised p-3 space-y-1">
            <p className="font-medium">3. General comments</p>
            <p className="text-text-dim">“Nice content!” Your choice below: an AI thank-you, one of your own thank-you lines, or no reply. Spam and abuse are always skipped.</p>
          </div>
        </div>
      </section>
      <TemplatesForm initial={normaliseTemplates(settings.botTemplates)} />
    </div>
  );
}
