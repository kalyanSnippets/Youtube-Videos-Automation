import {
  exchangeInstagramCode,
  getInstagramProfile,
  saveConnection,
  subscribeInstagramWebhooks,
  verifyOAuthState,
} from "@yaos/comment-bot";
import { botBaseUrl, resultPage } from "@/lib/comment-bot";
import { appSecret } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const secret = appSecret();
  if (!secret || !verifyOAuthState(params.get("state"), "INSTAGRAM", secret)) {
    return resultPage("Link expired", "Start again from the Connect Instagram link (links are valid for 15 minutes).", false);
  }
  if (params.get("error")) {
    return resultPage("Instagram was not connected", params.get("error_description") ?? params.get("error")!, false);
  }
  const code = params.get("code");
  if (!code) return resultPage("Instagram was not connected", "Instagram did not return a code.", false);
  try {
    const token = await exchangeInstagramCode({
      code,
      appId: process.env.INSTAGRAM_APP_ID!,
      appSecret: process.env.INSTAGRAM_APP_SECRET!,
      redirectUri: `${botBaseUrl(request)}/api/comment-bot/instagram/callback`,
    });
    const profile = await getInstagramProfile(token.access_token);
    await subscribeInstagramWebhooks(token.access_token);
    await saveConnection({
      platform: "INSTAGRAM",
      accountId: profile.id,
      accountName: `@${profile.username}`,
      accessToken: token.access_token,
      refreshToken: null,
      accessTokenExpiresAt: new Date(Date.now() + token.expires_in * 1000),
    });
    return resultPage("Instagram connected ✅", `The bot will now reply to comments on @${profile.username} and DM keyword prompts.`, true);
  } catch (error) {
    return resultPage("Instagram was not connected", (error as Error).message, false);
  }
}
