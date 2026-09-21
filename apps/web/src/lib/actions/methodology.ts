"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@yaos/database";
import { runExperimentDesigner } from "@yaos/agents";

export async function runExperimentDesignerAction(projectId: string) {
  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, projectId));
  if (!project) throw new Error("Project not found");
  after(async () => {
    try {
      await runExperimentDesigner({ db, projectId, topic: project.seedIdea || project.title });
    } catch (err) {
      console.error(`Background EXPERIMENT_DESIGNER failed for project ${projectId}:`, err);
    }
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/methodology`);
  });
}
