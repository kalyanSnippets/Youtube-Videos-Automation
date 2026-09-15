"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@yaos/database";
import { runExperimentDesigner } from "@yaos/agents";

export async function runExperimentDesignerAction(projectId: string) {
  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, projectId));
  if (!project) throw new Error("Project not found");
  await runExperimentDesigner({ db, projectId, topic: project.seedIdea || project.title });
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/methodology`);
}
