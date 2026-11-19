import { eq } from "drizzle-orm";
import { db, schema } from "@yaos/database";
import { getConnection, instagramGraphBase, type InstagramMode } from "@yaos/comment-bot";

export const dynamic = "force-dynamic";

/**
 * Serves a video's thumbnail from our own domain.
 * Instagram's image links are signed and expire after a few days (and often refuse to load on other
 * sites), so when the stored link fails we ask Instagram for a fresh one and save it. YouTube falls
 * back to its standard thumbnail address. If nothing works we return a neutral placeholder rather
 * than a broken image.
 */

const PLACEHOLDER = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#12151d"/><stop offset="1" stop-color="#1d2230"/></linearGradient></defs><rect width="16" height="9" fill="url(#g)"/><path d="M7 3.2v2.6L9.3 4.5z" fill="#3fe6cf" opacity=".55"/></svg>`;

async function tryFetch(url: string | null | undefined): Promise<Response | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (thumbnail proxy)" } });
    const type = res.headers.get("content-type") ?? "";
    if (res.ok && type.startsWith("image/")) return res;
  } catch {
    // fall through
  }
  return null;
}

async function freshInstagramUrl(externalId: string): Promise<string | null> {
  const conn = await getConnection("INSTAGRAM");
  if (!conn?.accessToken) return null;
  const base = instagramGraphBase((conn.metadata as { mode?: InstagramMode } | null)?.mode);
  try {
    const res = await fetch(`${base}/${externalId}?${new URLSearchParams({ fields: "media_type,media_url,thumbnail_url", access_token: conn.accessToken })}`);
    if (!res.ok) return null;
    const m = (await res.json()) as { media_type?: string; media_url?: string; thumbnail_url?: string };
    return m.thumbnail_url ?? (m.media_type === "IMAGE" || m.media_type === "CAROUSEL_ALBUM" ? m.media_url ?? null : null);
  } catch {
    return null;
  }
}

function imageResponse(res: Response): Response {
  return new Response(res.body, {
    headers: {
      "content-type": res.headers.get("content-type") ?? "image/jpeg",
      // Browsers keep it a day; Netlify's CDN keeps it a day and serves stale copies for a week while refreshing.
      "cache-control": "public, max-age=86400",
      "netlify-cdn-cache-control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const placeholder = () =>
    new Response(PLACEHOLDER, { headers: { "content-type": "image/svg+xml", "cache-control": "public, max-age=600" } });
  if (!/^[0-9a-f-]{36}$/i.test(id)) return placeholder();

  const [video] = await db.select().from(schema.videos).where(eq(schema.videos.id, id)).catch(() => []);
  if (!video || video.hidden) return placeholder();

  const stored = await tryFetch(video.thumbnailUrl);
  if (stored) return imageResponse(stored);

  if (video.platform === "INSTAGRAM") {
    const fresh = await freshInstagramUrl(video.externalId);
    const res = await tryFetch(fresh);
    if (res && fresh) {
      await db.update(schema.videos).set({ thumbnailUrl: fresh }).where(eq(schema.videos.id, video.id)).catch(() => undefined);
      return imageResponse(res);
    }
  } else {
    const fallback = await tryFetch(`https://i.ytimg.com/vi/${video.externalId}/hqdefault.jpg`);
    if (fallback) return imageResponse(fallback);
  }
  return placeholder();
}
