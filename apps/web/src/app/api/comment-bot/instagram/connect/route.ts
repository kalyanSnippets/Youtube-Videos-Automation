import { NextResponse } from "next/server";
import { createOAuthState, instagramAuthUrl, unifiedAuthUrl } from "@yaos/comment-bot";
import { botBaseUrl, isAuthorised, notAuthorised, resultPage } from "@/lib/comment-bot";
import { appSecret } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Visit while signed in to link your Instagram account. With META_LOGIN_CONFIG_ID set (apps made
 * since late 2026) this uses Meta's "Unified login" (Facebook Login for Business); otherwise the
 * older Instagram Login.
 */
export async function GET(request: Request) {
  if (!(await isAuthorised(request))) return notAuthorised();
  const appId = process.env.INSTAGRAM_APP_ID;
  if (!appId || !process.env.INSTAGRAM_APP_SECRET) {
    return resultPage("Instagram is not set up yet", "Add INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET to the site's environment variables, redeploy, then try again.", false);
  }
  const redirectUri = `${botBaseUrl(request)}/api/comment-bot/instagram/callback`;
  const state = createOAuthState("INSTAGRAM", appSecret()!);
  const configId = process.env.META_LOGIN_CONFIG_ID;
  return NextResponse.redirect(configId ? unifiedAuthUrl({ appId, configId, redirectUri, state }) : instagramAuthUrl({ appId, redirectUri, state }));
}
