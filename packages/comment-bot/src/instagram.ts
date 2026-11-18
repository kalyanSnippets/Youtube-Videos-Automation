import { createHmac, timingSafeEqual } from "node:crypto";
import type { IncomingComment, MediaContext } from "./types";

/**
 * Instagram API with Instagram Login (graph.instagram.com). Works with a Business or Creator
 * account and does not need a Facebook Page. Comments arrive by webhook; the bot answers with
 * a public reply (POST /{comment-id}/replies) and a private reply DM (POST /{ig-id}/messages
 * with recipient.comment_id). Meta allows one private reply per comment, within 7 days.
 */
export const IG_VERSION = process.env.INSTAGRAM_GRAPH_VERSION ?? "v24.0";
const GRAPH = `https://graph.instagram.com/${IG_VERSION}`;
export const INSTAGRAM_SCOPES = [
  "instagram_business_basic",
  "instagram_business_manage_comments",
  "instagram_business_manage_messages",
];

export function instagramAuthUrl(p: { appId: string; redirectUri: string; state: string }): string {
  const q = new URLSearchParams({
    client_id: p.appId,
    redirect_uri: p.redirectUri,
    response_type: "code",
    scope: INSTAGRAM_SCOPES.join(","),
    state: p.state,
  });
  return `https://www.instagram.com/oauth/authorize?${q}`;
}

async function readJson<T>(response: Response, what: string): Promise<T> {
  const json = (await response.json().catch(() => ({}))) as T & { error?: { message?: string } | string; error_message?: string };
  if (!response.ok) {
    const msg = typeof json.error === "string" ? json.error : json.error?.message ?? json.error_message ?? "unknown error";
    throw new Error(`Instagram ${what} failed (${response.status}): ${msg}`);
  }
  return json;
}

/** Code -> short-lived token -> 60-day long-lived token, plus the account id webhooks use. */
export async function exchangeInstagramCode(p: { code: string; appId: string; appSecret: string; redirectUri: string }) {
  const short = await readJson<{ access_token: string }>(
    await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: p.appId,
        client_secret: p.appSecret,
        grant_type: "authorization_code",
        redirect_uri: p.redirectUri,
        code: p.code.replace(/#_$/, ""),
      }),
    }),
    "code exchange",
  );
  const long = await readJson<{ access_token: string; expires_in: number }>(
    await fetch(
      `https://graph.instagram.com/access_token?${new URLSearchParams({ grant_type: "ig_exchange_token", client_secret: p.appSecret, access_token: short.access_token })}`,
    ),
    "long-lived token exchange",
  );
  return long;
}

export async function refreshInstagramToken(accessToken: string): Promise<{ access_token: string; expires_in: number }> {
  return readJson(
    await fetch(`https://graph.instagram.com/refresh_access_token?${new URLSearchParams({ grant_type: "ig_refresh_token", access_token: accessToken })}`),
    "token refresh",
  );
}

export async function getInstagramProfile(accessToken: string): Promise<{ id: string; username: string }> {
  const json = await readJson<{ user_id?: string; id?: string; username: string }>(
    await fetch(`${GRAPH}/me?${new URLSearchParams({ fields: "user_id,username", access_token: accessToken })}`),
    "profile lookup",
  );
  // user_id is the professional account id that webhooks send as entry.id.
  return { id: String(json.user_id ?? json.id), username: json.username };
}

/** Tell Meta to send this account's comment events to the app's webhook. */
export async function subscribeInstagramWebhooks(accessToken: string): Promise<void> {
  await readJson(
    await fetch(`${GRAPH}/me/subscribed_apps?${new URLSearchParams({ subscribed_fields: "comments", access_token: accessToken })}`, { method: "POST" }),
    "webhook subscription",
  );
}

export async function getInstagramMediaContext(accessToken: string, mediaId: string): Promise<MediaContext> {
  try {
    const json = await readJson<{ caption?: string; permalink?: string }>(
      await fetch(`${GRAPH}/${mediaId}?${new URLSearchParams({ fields: "caption,permalink", access_token: accessToken })}`),
      "media lookup",
    );
    return { description: json.caption, url: json.permalink };
  } catch {
    return {};
  }
}

export async function replyToInstagramComment(accessToken: string, commentId: string, message: string): Promise<string> {
  const json = await readJson<{ id?: string }>(
    await fetch(`${GRAPH}/${commentId}/replies`, {
      method: "POST",
      headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ message }),
    }),
    "comment reply",
  );
  return json.id ?? "";
}

export async function sendInstagramPrivateReply(accessToken: string, igAccountId: string, commentId: string, text: string): Promise<void> {
  await readJson(
    await fetch(`${GRAPH}/${igAccountId}/messages`, {
      method: "POST",
      headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
      body: JSON.stringify({ recipient: { comment_id: commentId }, message: { text } }),
    }),
    "private reply",
  );
}

/** Meta signs every webhook body with the app secret: X-Hub-Signature-256: sha256=<hex>. */
export function verifyMetaSignature(rawBody: string, header: string | null, appSecret: string): boolean {
  if (!header?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");
  const given = header.slice("sha256=".length);
  if (given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(given, "hex"), Buffer.from(expected, "hex"));
}

interface WebhookBody {
  object?: string;
  entry?: {
    id?: string;
    time?: number;
    changes?: {
      field?: string;
      value?: {
        id?: string;
        text?: string;
        parent_id?: string;
        from?: { id?: string; username?: string; self_ig_scoped_id?: string };
        media?: { id?: string; media_product_type?: string };
      };
    }[];
  }[];
}

/** Pull comment events out of a webhook payload. Comments written by the account itself are dropped here. */
export function parseInstagramWebhook(body: unknown): { accountId: string; comment: IncomingComment }[] {
  const parsed = body as WebhookBody;
  if (parsed?.object !== "instagram") return [];
  const out: { accountId: string; comment: IncomingComment }[] = [];
  for (const entry of parsed.entry ?? []) {
    const accountId = String(entry.id ?? "");
    for (const change of entry.changes ?? []) {
      if (change.field !== "comments" && change.field !== "live_comments") continue;
      const v = change.value;
      if (!v?.id || typeof v.text !== "string") continue;
      // The bot's own replies come back as webhook events too; ignoring them prevents reply loops.
      if (v.from?.id && v.from.id === accountId) continue;
      out.push({
        accountId,
        comment: {
          platform: "INSTAGRAM",
          commentId: String(v.id),
          text: v.text,
          authorId: v.from?.id,
          authorName: v.from?.username,
          mediaId: v.media?.id,
          parentCommentId: v.parent_id,
          commentedAt: entry.time ? new Date(entry.time * 1000) : new Date(),
        },
      });
    }
  }
  return out;
}
