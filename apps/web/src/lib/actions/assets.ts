"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@yaos/database";
import { markAssetReady, transitionStage, logActivity } from "@yaos/agents";
import { checkAndAdvanceToAssetsReady } from "@/lib/project-readiness";

export async function markAssetReadyAction(assetId: string, projectId: string) {
  await markAssetReady(db, assetId, `local://uploaded/${assetId}`);
  await checkAndAdvanceToAssetsReady(projectId);

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/assets`);
}

export async function uploadNarrationAction(projectId: string) {
  // Placeholder for the real upload flow (local worker / file storage integration).
  // Marks a narration asset as READY so the pipeline can progress in MOCK/demo mode.
  const [row] = await db
    .insert(schema.assets)
    .values({
      projectId,
      filename: "narration-final.wav",
      category: "narration",
      status: "READY",
      sourceType: "real_screen_recording",
      localPath: "local://uploaded/narration-final.wav",
    })
    .returning();

  await logActivity(db, projectId, "USER", "NARRATION_UPLOADED", `Narration file ${row.filename} uploaded.`);

  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, projectId));
  if (project?.currentStage === "ASSETS_READY") {
    await transitionStage(db, projectId, "NARRATION_READY", "USER", "User");
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/assets`);
}
