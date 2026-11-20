"use server";

import { startAgentStep } from "@/lib/agent-jobs";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@yaos/database";
import { verifyClaim } from "@yaos/agents";
import type { ClaimType } from "@yaos/shared";

export async function runClaimsResearchAction(projectId: string) {
  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, projectId));
  if (!project) throw new Error("Project not found");
  await startAgentStep(projectId, "claims");
}

export async function verifyClaimAction(claimId: string, newType: ClaimType, projectId: string) {
  await verifyClaim(db, claimId, newType);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/claims`);
  revalidatePath(`/projects/${projectId}/script`);
  revalidatePath("/dashboard");
}
