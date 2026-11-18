import { NextResponse } from "next/server";
import { createOAuthState, instagramAuthUrl } from "@yaos/comment-bot";
import { botBaseUrl, botSecret, isAuthorised, notAuthorised, resultPage } from "@/lib/comment-bot";

export const dynamic = "force-dynamic";

/** Visit /api/comment-bot/instagram/connect?key=<COMMENT_BOT_SECRET> to link your Instagram account. */
export async function GET(request: Request) {
  if (!isAuthorised(request)) return notAuthorised();
  const appId = process.env.INSTAGRAM_APP_ID;
  if (!appId || !process.env.INSTAGRAM_APP_SECRET) {
    return resultPage("Instagram is not set up yet", "Add INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET to the site's environment variables, redeploy, then try again.", false);
  }
  const url = instagramAuthUrl({
    appId,
    redirectUri: `${botBaseUrl(request)}/api/comment-bot/instagram/callback`,
    state: createOAuthState("INSTAGRAM", botSecret()!),
  });
  return NextResponse.redirect(url);
}
