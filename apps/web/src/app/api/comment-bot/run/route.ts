import { NextResponse } from "next/server";
import { refreshInstagramTokenIfNeeded, retryInstagramFailures, runYouTubePoll } from "@yaos/comment-bot";
import { isAuthorised, notAuthorised } from "@/lib/comment-bot";

export const dynamic = "force-dynamic";

/**
 * Called every minute by netlify/functions/comment-bot-tick.mts. Polls YouTube (no webhooks
 * there), retries failed Instagram replies and keeps the Instagram token fresh.
 * You can also open /api/comment-bot/run while signed in to run it by hand.
 */
async function run(request: Request) {
  if (!(await isAuthorised(request))) return notAuthorised();
  const settle = async <T,>(fn: () => Promise<T>) => {
    try {
      return await fn();
    } catch (error) {
      return { error: (error as Error).message };
    }
  };
  const youtube = await settle(() => runYouTubePoll({ timeBudgetMs: 18_000 }));
  const instagramRetries = await settle(() => retryInstagramFailures());
  const instagramToken = await settle(() => refreshInstagramTokenIfNeeded());
  const result = { at: new Date().toISOString(), youtube, instagramRetries, instagramToken };
  console.log("[comment-bot] run", JSON.stringify(result));
  return NextResponse.json(result);
}

export const GET = run;
export const POST = run;
