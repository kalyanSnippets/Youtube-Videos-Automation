"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@yaos/database";
import { runIdeaResearch, selectIdea } from "@yaos/agents";

export async function rerunIdeaResearch(projectId: string) {
  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, projectId));
  if (!project) throw new Error("Project not found");
  after(async () => {
    try {
      await runIdeaResearch({ db, projectId, topic: project.seedIdea || project.title });
    } catch (err) {
      console.error(`Background IDEA_RESEARCH failed for project ${projectId}:`, err);
    }
    revalidatePath(`/projects/${projectId}/ideas`);
  });
}

export async function selectIdeaAction(projectId: string, ideaId: string) {
  await selectIdea(db, projectId, ideaId);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/ideas`);
  revalidatePath(`/projects/${projectId}/overview`);
  revalidatePath("/dashboard");
}
