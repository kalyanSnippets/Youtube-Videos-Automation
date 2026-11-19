import {
  exchangeInstagramCode,
  exchangeUnifiedCode,
  getInstagramProfile,
  getUnifiedInstagramAccounts,
  saveConnection,
  subscribeInstagramWebhooks,
  subscribeUnifiedWebhooks,
  verifyOAuthState,
} from "@yaos/comment-bot";
import { botBaseUrl, resultPage } from "@/lib/comment-bot";
import { appSecret } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const secret = appSecret();
  if (!secret || !verifyOAuthState(params.get("state"), "INSTAGRAM", secret)) {
    return resultPage("Link expired", "Start again from the Connect Instagram button (links are valid for 15 minutes).", false);
  }
  if (params.get("error")) {
    return resultPage("Instagram was not connected", params.get("error_description") ?? params.get("error_message") ?? params.get("error")!, false);
  }
  const code = params.get("code");
  if (!code) return resultPage("Instagram was not connected", "Meta did not return a code.", false);
  const appId = process.env.INSTAGRAM_APP_ID!;
  const appSecretValue = process.env.INSTAGRAM_APP_SECRET!;
  const redirectUri = `${botBaseUrl(request)}/api/comment-bot/instagram/callback`;

  try {
    if (process.env.META_LOGIN_CONFIG_ID) {
      const token = await exchangeUnifiedCode({ code, appId, appSecret: appSecretValue, redirectUri });
      const accounts = await getUnifiedInstagramAccounts(token.access_token);
      const wanted = process.env.INSTAGRAM_USERNAME?.replace(/^@/, "").toLowerCase();
      const account = (wanted && accounts.find((a) => a.username.toLowerCase() === wanted)) || accounts[0];
      if (!account) {
        return resultPage(
          "No Instagram account was shared",
          "Meta logged you in but didn't give the app access to an Instagram account. In Meta's app: Facebook Login for Business → Configurations → edit the configuration, add the business_management permission and make sure your Instagram account is selected as an asset. Then click Connect Instagram again.",
          false,
        );
      }
      const subscribeError = await subscribeUnifiedWebhooks(token.access_token, account.id);
      await saveConnection({
        platform: "INSTAGRAM",
        accountId: account.id,
        accountName: `@${account.username}`,
        accessToken: token.access_token,
        refreshToken: null,
        accessTokenExpiresAt: token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : null,
        metadata: { mode: "unified", subscribeError, otherAccounts: accounts.filter((a) => a.id !== account.id).map((a) => a.username) },
      });
      return resultPage(
        "Instagram connected ✅",
        `The bot will now reply to comments on @${account.username} and DM keyword prompts.${subscribeError ? ` (Note: automatic webhook subscription said "${subscribeError}". If comments don't arrive, check the comments field is subscribed in Meta's webhook settings.)` : ""}`,
        true,
      );
    }

    const token = await exchangeInstagramCode({ code, appId, appSecret: appSecretValue, redirectUri });
    const profile = await getInstagramProfile(token.access_token);
    await subscribeInstagramWebhooks(token.access_token);
    await saveConnection({
      platform: "INSTAGRAM",
      accountId: profile.id,
      accountName: `@${profile.username}`,
      accessToken: token.access_token,
      refreshToken: null,
      accessTokenExpiresAt: new Date(Date.now() + token.expires_in * 1000),
      metadata: { mode: "instagram-login" },
    });
    return resultPage("Instagram connected ✅", `The bot will now reply to comments on @${profile.username} and DM keyword prompts.`, true);
  } catch (error) {
    return resultPage("Instagram was not connected", (error as Error).message, false);
  }
}
