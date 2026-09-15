"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@yaos/database";
import { runCompetitorAnalysis, transitionStage, logActivity } from "@yaos/agents";

export async function runCompetitorAnalysisAction(projectId: string) {
  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, projectId));
  if (!project) throw new Error("Project not found");
  await runCompetitorAnalysis({ db, projectId, topic: project.seedIdea || project.title });
  if (project.currentStage === "IDEA_SELECTED") {
    await transitionStage(db, projectId, "REFERENCES_ANALYSED", "AGENT", "Competitor Analyst");
  }
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/references`);
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
