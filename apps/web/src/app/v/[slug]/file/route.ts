import { and, eq } from "drizzle-orm";
import { db, ensureSchemaPatches, schema } from "@yaos/database";

export const dynamic = "force-dynamic";

/**
 * The document uploaded for a video, served as a download. This is the link the comment bot
 * sends in DMs, and the target of the Download button on the video's page.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await ensureSchemaPatches();
  const [video] = await db
    .select({ id: schema.videos.id, name: schema.videos.attachmentName, type: schema.videos.attachmentType })
    .from(schema.videos)
    .where(and(eq(schema.videos.slug, slug), eq(schema.videos.hidden, false)));
  if (!video?.name) return new Response("No file for this video.", { status: 404 });
  const [file] = await db.select().from(schema.videoAttachments).where(eq(schema.videoAttachments.videoId, video.id));
  if (!file) return new Response("No file for this video.", { status: 404 });
  const ascii = video.name.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "'");
  return new Response(Buffer.from(file.data, "base64"), {
    headers: {
      "content-type": video.type ?? "application/octet-stream",
      "content-disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(video.name)}`,
      "cache-control": "public, max-age=300",
      "x-content-type-options": "nosniff",
    },
  });
}
