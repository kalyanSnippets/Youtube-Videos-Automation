"use server";

import { startAgentStep } from "@/lib/agent-jobs";
import { revalidatePath } from "next/cache";
import { eq, and, desc } from "drizzle-orm";
import { db, schema } from "@yaos/database";

export async function runProductionDirectorAction(projectId: string) {
  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, projectId));
  if (!project) throw new Error("Project not found");
  const [approvedScript] = await db
    .select()
    .from(schema.scripts)
    .where(and(eq(schema.scripts.projectId, projectId), eq(schema.scripts.status, "APPROVED")))
    .orderBy(desc(schema.scripts.version))
    .limit(1);
  if (!approvedScript) throw new Error("No approved script found.");

  await startAgentStep(projectId, "production");
}

export async function runAssetPlannerAction(projectId: string) {
  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, projectId));
  if (!project) throw new Error("Project not found");
  await startAgentStep(projectId, "assets");
}
