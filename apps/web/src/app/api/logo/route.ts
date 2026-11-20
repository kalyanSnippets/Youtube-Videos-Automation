import { eq } from "drizzle-orm";
import { db, ensureSchemaPatches, schema } from "@yaos/database";

export const dynamic = "force-dynamic";

/**
 * The site logo, used in the admin menu, the public header, the sign-in page and as the browser
 * tab icon. Order: an uploaded logo (Settings → Website), else the YouTube channel's profile
 * picture, else a simple "AK" mark.
 */
const FALLBACK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3fe6cf"/><stop offset="1" stop-color="#8b7bf0"/></linearGradient></defs><rect width="64" height="64" rx="14" fill="url(#g)"/><text x="32" y="41" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="24" font-weight="800" fill="#0a0c11">AK</text></svg>`;

const headers = (type: string) => ({
  "content-type": type,
  "cache-control": "public, max-age=3600",
  "netlify-cdn-cache-control": "public, s-maxage=3600, stale-while-revalidate=86400",
});

export async function GET() {
  try {
    await ensureSchemaPatches();
    const [settings] = await db.select({ logoData: schema.siteSettings.logoData }).from(schema.siteSettings).where(eq(schema.siteSettings.id, 1));
    const m = settings?.logoData?.match(/^data:(image\/[\w+.-]+);base64,(.+)$/);
    if (m) return new Response(Buffer.from(m[2]!, "base64"), { headers: headers(m[1]!) });

    const [yt] = await db.select({ metadata: schema.socialConnections.metadata }).from(schema.socialConnections).where(eq(schema.socialConnections.platform, "YOUTUBE"));
    const avatar = (yt?.metadata as { avatarUrl?: string } | null)?.avatarUrl;
    if (avatar) {
      const res = await fetch(avatar);
      const type = res.headers.get("content-type") ?? "";
      if (res.ok && type.startsWith("image/")) return new Response(res.body, { headers: headers(type) });
    }
  } catch {
    // fall through to the built-in mark
  }
  return new Response(FALLBACK, { headers: { "content-type": "image/svg+xml", "cache-control": "public, max-age=600" } });
}
