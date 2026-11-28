import { eq, sql } from "drizzle-orm";
import { db, schema } from "@yaos/database";

export const dynamic = "force-dynamic";

/** Counts a visit to a video page (shown on the Analytics page). The page itself is cached, so it pings this. */
export async function POST(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[\w-]{1,160}$/.test(slug)) return new Response(null, { status: 204 });
  await db
    .update(schema.videos)
    .set({ pageViews: sql`${schema.videos.pageViews} + 1` })
    .where(eq(schema.videos.slug, slug))
    .catch(() => undefined);
  return new Response(null, { status: 204 });
}
