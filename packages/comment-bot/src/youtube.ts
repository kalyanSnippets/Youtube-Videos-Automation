import type { IncomingComment, MediaContext } from "./types";

/**
 * YouTube Data API v3. YouTube has no comment webhooks, so the bot polls
 * commentThreads.list (1 quota unit) every minute and replies with comments.insert
 * (50 units). The default 10,000 units/day covers about 1,440 polls + ~170 replies.
 */
const API = "https://www.googleapis.com/youtube/v3";
export const YOUTUBE_ANALYTICS_SCOPE = "https://www.googleapis.com/auth/yt-analytics.readonly";
/** Comments (read + reply) and read-only analytics for the Analytics page. */
export const YOUTUBE_SCOPES = ["https://www.googleapis.com/auth/youtube.force-ssl", YOUTUBE_ANALYTICS_SCOPE];

/** True when this YouTube connection was granted analytics access (stored from the token's scope list). */
export function hasAnalyticsScope(metadata: unknown): boolean {
  const scopes = (metadata as { scopes?: string } | null)?.scopes ?? "";
  return scopes.includes("yt-analytics");
}

export function youtubeAuthUrl(params: { clientId: string; redirectUri: string; state: string }): string {
  const q = new URLSearchParams({
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    response_type: "code",
    scope: YOUTUBE_SCOPES.join(" "),
    access_type: "offline",
    // Forces Google to return a refresh token even if the app was authorised before.
    prompt: "consent",
    include_granted_scopes: "true",
    state: params.state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${q}`;
}

interface TokenResponse {
  access_token: string;
  /** Space-separated scopes Google actually granted. */
  scope?: string;
  expires_in: number;
  refresh_token?: string;
}

async function tokenRequest(body: Record<string, string>): Promise<TokenResponse> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body),
  });
  const json = (await response.json()) as TokenResponse & { error?: string; error_description?: string };
  if (!response.ok) throw new Error(`Google token error: ${json.error_description ?? json.error ?? response.status}`);
  return json;
}

export function exchangeYouTubeCode(p: { code: string; clientId: string; clientSecret: string; redirectUri: string }) {
  return tokenRequest({ code: p.code, client_id: p.clientId, client_secret: p.clientSecret, redirect_uri: p.redirectUri, grant_type: "authorization_code" });
}

export function refreshYouTubeToken(p: { refreshToken: string; clientId: string; clientSecret: string }) {
  return tokenRequest({ refresh_token: p.refreshToken, client_id: p.clientId, client_secret: p.clientSecret, grant_type: "refresh_token" });
}

async function ytGet<T>(path: string, params: Record<string, string>, accessToken: string): Promise<T> {
  const response = await fetch(`${API}/${path}?${new URLSearchParams(params)}`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  const json = (await response.json()) as T & { error?: { message?: string } };
  if (!response.ok) throw new Error(`YouTube ${path} failed (${response.status}): ${json.error?.message ?? "unknown error"}`);
  return json;
}

export async function getMyChannel(accessToken: string): Promise<{ id: string; title: string; avatarUrl: string | null }> {
  const json = await ytGet<{ items?: { id: string; snippet: { title: string; thumbnails?: Record<string, { url?: string }> } }[] }>(
    "channels",
    { part: "snippet", mine: "true" },
    accessToken,
  );
  const channel = json.items?.[0];
  if (!channel) throw new Error("This Google account has no YouTube channel.");
  const t = channel.snippet.thumbnails ?? {};
  return { id: channel.id, title: channel.snippet.title, avatarUrl: (t.high ?? t.medium ?? t.default)?.url ?? null };
}

interface ThreadItem {
  id: string;
  snippet: {
    videoId?: string;
    canReply?: boolean;
    totalReplyCount?: number;
    topLevelComment: {
      id: string;
      snippet: {
        textOriginal?: string;
        textDisplay?: string;
        authorDisplayName?: string;
        authorChannelId?: { value?: string };
        publishedAt?: string;
      };
    };
  };
  replies?: { comments?: { snippet: { authorChannelId?: { value?: string } } }[] };
}

export interface YouTubeThread {
  comment: IncomingComment;
  canReply: boolean;
  /** The channel owner already replied in this thread (by hand or earlier). */
  ownerAlreadyReplied: boolean;
}

/** Newest top-level comments across every video on the channel. */
export async function listRecentThreads(accessToken: string, channelId: string, maxResults = 50): Promise<YouTubeThread[]> {
  const json = await ytGet<{ items?: ThreadItem[] }>(
    "commentThreads",
    { part: "snippet,replies", allThreadsRelatedToChannelId: channelId, order: "time", maxResults: String(maxResults), textFormat: "plainText" },
    accessToken,
  );
  return (json.items ?? []).map((item) => {
    const top = item.snippet.topLevelComment;
    return {
      canReply: item.snippet.canReply !== false,
      ownerAlreadyReplied: (item.replies?.comments ?? []).some((c) => c.snippet.authorChannelId?.value === channelId),
      comment: {
        platform: "YOUTUBE",
        commentId: top.id,
        text: top.snippet.textOriginal ?? top.snippet.textDisplay ?? "",
        authorId: top.snippet.authorChannelId?.value,
        authorName: top.snippet.authorDisplayName,
        mediaId: item.snippet.videoId,
        commentedAt: top.snippet.publishedAt ? new Date(top.snippet.publishedAt) : undefined,
      },
    };
  });
}

export async function getVideoContexts(accessToken: string, videoIds: string[]): Promise<Map<string, MediaContext>> {
  const map = new Map<string, MediaContext>();
  const ids = [...new Set(videoIds)].slice(0, 50);
  if (!ids.length) return map;
  const json = await ytGet<{ items?: { id: string; snippet: { title: string; description: string } }[] }>(
    "videos",
    { part: "snippet", id: ids.join(",") },
    accessToken,
  );
  for (const v of json.items ?? []) {
    map.set(v.id, { title: v.snippet.title, description: v.snippet.description, url: `https://youtu.be/${v.id}` });
  }
  return map;
}

export async function replyToYouTubeComment(accessToken: string, parentId: string, text: string): Promise<string> {
  const response = await fetch(`${API}/comments?part=snippet`, {
    method: "POST",
    headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
    body: JSON.stringify({ snippet: { parentId, textOriginal: text } }),
  });
  const json = (await response.json()) as { id?: string; error?: { message?: string } };
  if (!response.ok) throw new Error(`YouTube reply failed (${response.status}): ${json.error?.message ?? "unknown error"}`);
  return json.id ?? "";
}
