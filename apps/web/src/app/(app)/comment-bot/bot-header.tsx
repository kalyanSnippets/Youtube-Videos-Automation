import { Badge } from "@/components/ui/badge";
import { BotTabs } from "./bot-tabs";

/** Shared title + tabs for every Comment Bot page. */
export function BotHeader({ subtitle }: { subtitle: string }) {
  const paused = /^(1|true|yes)$/i.test(process.env.COMMENT_BOT_PAUSED ?? "");
  const dryRun = /^(1|true|yes)$/i.test(process.env.COMMENT_BOT_DRY_RUN ?? "");
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px]">
          <h1 className="text-xl font-semibold mb-1">Comment Bot</h1>
          <p className="text-sm text-text-dim">{subtitle}</p>
        </div>
        {paused && <Badge variant="warning">Paused: not replying</Badge>}
        {dryRun && <Badge variant="purple">Dry run: nothing is posted</Badge>}
      </div>
      <BotTabs />
    </div>
  );
}
