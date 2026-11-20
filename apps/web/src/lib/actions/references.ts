"use server";

import { startAgentStep } from "@/lib/agent-jobs";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@yaos/database";
import { transitionStage, logActivity } from "@yaos/agents";

export async function runCompetitorAnalysisAction(projectId: string) {
  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, projectId));
  if (!project) throw new Error("Project not found");
  await startAgentStep(projectId, "references");
}

export async function confirmReferencesAction(projectId: string) {
  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, projectId));
  if (project?.currentStage === "IDEA_SELECTED") {
    await transitionStage(db, projectId, "REFERENCES_ANALYSED", "USER", "User");
    await logActivity(db, projectId, "USER", "REFERENCES_CONFIRMED", "User confirmed reference video analysis.");
  }
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/references`);
}
