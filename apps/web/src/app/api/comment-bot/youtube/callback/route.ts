import { exchangeYouTubeCode, getMyChannel, saveConnection, verifyOAuthState } from "@yaos/comment-bot";
import { botBaseUrl, resultPage } from "@/lib/comment-bot";
import { appSecret } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const secret = appSecret();
  if (!secret || !verifyOAuthState(params.get("state"), "YOUTUBE", secret)) {
    return resultPage("Link expired", "Start again from the Connect YouTube link (links are valid for 15 minutes).", false);
  }
  if (params.get("error")) return resultPage("YouTube was not connected", `Google said: ${params.get("error")}`, false);
  const code = params.get("code");
  if (!code) return resultPage("YouTube was not connected", "Google did not return a code.", false);
  try {
    const token = await exchangeYouTubeCode({
      code,
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectUri: `${botBaseUrl(request)}/api/comment-bot/youtube/callback`,
    });
    if (!token.refresh_token) {
      return resultPage(
        "Almost: no refresh token",
        "Google didn't give a long-term token. Remove the app at myaccount.google.com/permissions and connect again.",
        false,
      );
    }
    const channel = await getMyChannel(token.access_token);
    await saveConnection({
      platform: "YOUTUBE",
      accountId: channel.id,
      accountName: channel.title,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      accessTokenExpiresAt: new Date(Date.now() + token.expires_in * 1000),
      metadata: { scopes: token.scope ?? "" },
    });
    const analytics = (token.scope ?? "").includes("yt-analytics");
    return resultPage(
      "YouTube connected ✅",
      `The bot will now reply to comments on ${channel.title}. New comments are picked up within about a minute.${
        analytics ? " Analytics are on: numbers appear on the Analytics page within a few minutes." : " Analytics access wasn't granted; tick it on Google's screen next time to see your numbers."
      }`,
      true,
    );
  } catch (error) {
    return resultPage("YouTube was not connected", (error as Error).message, false);
  }
}
