"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@yaos/database";
import { runIdeaResearch } from "@yaos/agents";
import { recommendPresentationMode, type ContentType, type PresentationMode } from "@yaos/shared";
import { getCurrentUser } from "@/lib/auth";

function slugify(title: string): string {
  return `${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}-${randomUUID().slice(0, 6)}`;
}

export async function createProject(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in.");

  const seedIdea = String(formData.get("seedIdea") ?? "").trim();
  const contentType = String(formData.get("contentType") ?? "explainer") as ContentType;
  const targetDurationMinutes = Number(formData.get("targetDurationMinutes") ?? 8);
  const language = String(formData.get("language") ?? "en");
  const budgetTier = String(formData.get("budgetTier") ?? "low_free_first");
  const evergreenOrTrend = String(formData.get("evergreenOrTrend") ?? "evergreen");
  const researchDepth = String(formData.get("researchDepth") ?? "standard");

  // Empty selection means "use the recommendation for this content type" - the creator can
  // always override later from the Overview tab, and doing so clears presentationModeIsRecommended.
  const presentationModeChoice = String(formData.get("presentationMode") ?? "");
  const presentationModeIsRecommended = presentationModeChoice === "";
  const presentationMode: PresentationMode = presentationModeIsRecommended
    ? recommendPresentationMode(contentType)
    : (presentationModeChoice as PresentationMode);

  const title = seedIdea || `Untitled ${contentType} video`;

  const [project] = await db
    .insert(schema.projects)
    .values({
      id: randomUUID(),
      workspaceId: user.workspaceId,
      title,
      slug: slugify(title),
      contentType,
      seedIdea: seedIdea || null,
      targetDurationMinutes,
      language,
      budgetTier,
      evergreenOrTrend,
      presentationMode,
      presentationModeIsRecommended,
      researchDepth,
      currentStage: "IDEA_RESEARCH",
    })
    .returning();

  await db.insert(schema.projectActivity).values({
    id: randomUUID(),
    projectId: project.id,
    actorType: "USER",
    action: "PROJECT_CREATED",
    summary: `Project created${seedIdea ? ` from seed idea "${seedIdea}"` : ""}.`,
  });

  // Deferred: a real Claude call for 20-30 detailed ideas can take well over a minute, far past
  // what any serverless function would tolerate blocking a request/redirect on. The user is sent
  // straight to the ideas tab, which polls for results while this finishes in the background.
  after(async () => {
    try {
      await runIdeaResearch({ db, projectId: project.id, topic: title });
    } catch (err) {
      console.error(`Background IDEA_RESEARCH failed for project ${project.id}:`, err);
    }
    revalidatePath("/dashboard");
    revalidatePath("/projects");
    revalidatePath(`/projects/${project.id}/ideas`);
  });

  revalidatePath("/dashboard");
  revalidatePath("/projects");
  redirect(`/projects/${project.id}/ideas`);
}

export async function archiveProject(projectId: string) {
  await db.update(schema.projects).set({ archivedAt: new Date() }).where(eq(schema.projects.id, projectId));
  revalidatePath("/dashboard");
  revalidatePath("/projects");
}

export async function unarchiveProject(projectId: string) {
  await db.update(schema.projects).set({ archivedAt: null }).where(eq(schema.projects.id, projectId));
  revalidatePath("/dashboard");
  revalidatePath("/projects");
}

export async function deleteProject(projectId: string) {
  await db.delete(schema.projects).where(eq(schema.projects.id, projectId));
  revalidatePath("/dashboard");
  revalidatePath("/projects");
  redirect("/projects");
}
