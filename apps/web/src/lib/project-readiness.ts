import { eq } from "drizzle-orm";
import { db, schema } from "@yaos/database";
import { transitionStage } from "@yaos/agents";

/**
 * ASSETS_REQUESTED -> ASSETS_READY only once every planned asset AND every
 * planned A-roll shot is marked ready - a HYBRID/FACE_LED project isn't
 * "assets ready" while the creator still has on-camera footage to film.
 */
export async function checkAndAdvanceToAssetsReady(projectId: string) {
  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, projectId));
  if (project?.currentStage !== "ASSETS_REQUESTED") return;

  const assets = await db.select().from(schema.assets).where(eq(schema.assets.projectId, projectId));
  const arollShots = await db.select().from(schema.arollShots).where(eq(schema.arollShots.projectId, projectId));
  const totalItems = assets.length + arollShots.length;
  if (totalItems === 0) return;

  const allReady = assets.every((a) => a.status === "READY") && arollShots.every((s) => s.status === "READY");
  if (allReady) {
    await transitionStage(db, projectId, "ASSETS_READY", "SYSTEM", "Next Action Engine", "All planned assets and A-roll shots marked ready.");
  }
}
