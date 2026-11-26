import { eq } from "drizzle-orm";
import { db, ensureSchemaPatches, schema } from "@yaos/database";

/**
 * The creator's logo as image bytes: the logo uploaded in Settings → Website, else the YouTube
 * channel's profile picture. Null means "use the built-in AK mark".
 */
export async function getLogoImage(): Promise<{ type: string; bytes: Buffer } | null> {
  try {
    await ensureSchemaPatches();
    const [settings] = await db.select({ logoData: schema.siteSettings.logoData }).from(schema.siteSettings).where(eq(schema.siteSettings.id, 1));
    const m = settings?.logoData?.match(/^data:(image\/[\w+.-]+);base64,(.+)$/);
    if (m) return { type: m[1]!, bytes: Buffer.from(m[2]!, "base64") };

    const [yt] = await db.select({ metadata: schema.socialConnections.metadata }).from(schema.socialConnections).where(eq(schema.socialConnections.platform, "YOUTUBE"));
    const avatar = (yt?.metadata as { avatarUrl?: string } | null)?.avatarUrl;
    if (avatar) {
      const res = await fetch(avatar, { signal: AbortSignal.timeout(4000) });
      const type = res.headers.get("content-type") ?? "";
      if (res.ok && type.startsWith("image/")) return { type, bytes: Buffer.from(await res.arrayBuffer()) };
    }
  } catch {
    // fall back to the built-in mark
  }
  return null;
}
