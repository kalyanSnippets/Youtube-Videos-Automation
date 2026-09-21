"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@yaos/database";
import { runStoryWriter, approveScript } from "@yaos/agents";

export async function runStoryWriterAction(projectId: string) {
  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, projectId));
  if (!project) throw new Error("Project not found");
  after(async () => {
    try {
      await runStoryWriter({ db, projectId, topic: project.seedIdea || project.title });
    } catch (err) {
      console.error(`Background STORY_WRITER failed for project ${projectId}:`, err);
    }
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/script`);
  });
}

export async function approveScriptAction(formData: FormData) {
  const projectId = String(formData.get("projectId"));
  const scriptId = String(formData.get("scriptId"));
  const override = formData.get("override") === "on";
  const overrideReason = String(formData.get("overrideReason") ?? "");

  await approveScript(db, projectId, scriptId, "User", override, override ? overrideReason : undefined);

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/script`);
  revalidatePath("/dashboard");
}
