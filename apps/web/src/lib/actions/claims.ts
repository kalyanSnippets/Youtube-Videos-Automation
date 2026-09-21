"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@yaos/database";
import { runClaimsResearch, verifyClaim } from "@yaos/agents";
import type { ClaimType } from "@yaos/shared";

export async function runClaimsResearchAction(projectId: string) {
  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, projectId));
  if (!project) throw new Error("Project not found");
  after(async () => {
    try {
      await runClaimsResearch({ db, projectId, topic: project.seedIdea || project.title });
    } catch (err) {
      console.error(`Background TRUST_CLAIMS_RESEARCHER failed for project ${projectId}:`, err);
    }
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/claims`);
  });
}

export async function verifyClaimAction(claimId: string, newType: ClaimType, projectId: string) {
  await verifyClaim(db, claimId, newType);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/claims`);
  revalidatePath(`/projects/${projectId}/script`);
  revalidatePath("/dashboard");
}
