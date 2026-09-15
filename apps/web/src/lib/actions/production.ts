"use server";

import { revalidatePath } from "next/cache";
import { eq, and, desc } from "drizzle-orm";
import { db, schema } from "@yaos/database";
import { runProductionDirector, runAssetPlanner, transitionStage } from "@yaos/agents";

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

  await runProductionDirector({ db, projectId, scriptId: approvedScript.id, topic: project.seedIdea || project.title });
  if (project.currentStage === "SCRIPT_APPROVED") {
    await transitionStage(db, projectId, "PRODUCTION_PLAN_READY", "AGENT", "Production Director");
  }
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/production`);
}

export async function runAssetPlannerAction(projectId: string) {
  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, projectId));
  if (!project) throw new Error("Project not found");
  await runAssetPlanner({ db, projectId, topic: project.seedIdea || project.title });
  if (project.currentStage === "PRODUCTION_PLAN_READY") {
    await transitionStage(db, projectId, "ASSETS_REQUESTED", "AGENT", "Asset Planner");
  }
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/shot-list`);
  revalidatePath(`/projects/${projectId}/assets`);
}
