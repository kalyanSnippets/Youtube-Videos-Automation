import { NextResponse } from "next/server";
import { createOAuthState, youtubeAuthUrl } from "@yaos/comment-bot";
import { botBaseUrl, isAuthorised, notAuthorised, resultPage } from "@/lib/comment-bot";
import { appSecret } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Visit /api/comment-bot/youtube/connectwhile signed in to link your channel. */
export async function GET(request: Request) {
  if (!(await isAuthorised(request))) return notAuthorised();
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId || !process.env.GOOGLE_CLIENT_SECRET) {
    return resultPage("YouTube is not set up yet", "Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to the site's environment variables, redeploy, then try again.", false);
  }
  const url = youtubeAuthUrl({
    clientId,
    redirectUri: `${botBaseUrl(request)}/api/comment-bot/youtube/callback`,
    state: createOAuthState("YOUTUBE", appSecret()!),
  });
  return NextResponse.redirect(url);
}
