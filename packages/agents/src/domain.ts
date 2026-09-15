import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { schema } from "@yaos/database";
import type { Database } from "@yaos/database";
import { canTransition, type Stage } from "@yaos/shared";
import { logActivity } from "./run-agent";
import { computeProjectSignals } from "./signals";

/**
 * Domain actions enforce the project state machine's gates. Every stage
 * transition in the app goes through transitionStage() so history is always
 * recorded and illegal jumps are rejected - the UI/server actions never
 * write project.currentStage directly.
 */
export async function transitionStage(
  db: Database,
  projectId: string,
  toStage: Stage,
  actorType: "USER" | "AGENT" | "SYSTEM",
  actorLabel: string | undefined,
  note?: string,
) {
  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, projectId));
  if (!project) throw new Error(`Project ${projectId} not found`);
  if (!canTransition(project.currentStage, toStage, project.contentType)) {
    throw new Error(`Cannot transition project from ${project.currentStage} to ${toStage} for content type ${project.contentType}`);
  }
  await db.update(schema.projects).set({ currentStage: toStage, updatedAt: new Date() }).where(eq(schema.projects.id, projectId));
  await db.insert(schema.projectStageHistory).values({
    id: randomUUID(),
    projectId,
    fromStage: project.currentStage,
    toStage,
    actorType,
    actorLabel,
    note,
  });
  return toStage;
}

export async function selectIdea(db: Database, projectId: string, ideaId: string, actorLabel = "User") {
  await db.update(schema.videoIdeas).set({ isSelected: false }).where(eq(schema.videoIdeas.projectId, projectId));
  await db.update(schema.videoIdeas).set({ isSelected: true }).where(eq(schema.videoIdeas.id, ideaId));
  await db.update(schema.projects).set({ selectedIdeaId: ideaId, updatedAt: new Date() }).where(eq(schema.projects.id, projectId));

  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, projectId));
  if (project?.currentStage === "IDEA_RESEARCH") {
    await transitionStage(db, projectId, "IDEA_SELECTED", "USER", actorLabel);
  }
  await logActivity(db, projectId, "USER", "IDEA_SELECTED", `User selected idea ${ideaId}.`);
}

export async function verifyClaim(
  db: Database,
  claimId: string,
  newType: "FACT" | "OUR_TEST" | "COMMUNITY" | "OPINION" | "UNVERIFIED",
  verifiedBy = "User",
) {
  const [claim] = await db
    .update(schema.claims)
    .set({ claimType: newType, verifiedAt: new Date(), verifiedBy, updatedAt: new Date() })
    .where(eq(schema.claims.id, claimId))
    .returning();
  if (!claim) throw new Error(`Claim ${claimId} not found`);
  await logActivity(db, claim.projectId, "USER", "CLAIM_REVIEWED", `Claim marked ${newType} by ${verifiedBy}.`, { claimId });

  // Auto-advance REFERENCES_ANALYSED -> CLAIMS_VERIFIED once every claim is resolved.
  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, claim.projectId));
  if (project?.currentStage === "REFERENCES_ANALYSED") {
    const signals = await computeProjectSignals(db, claim.projectId);
    if (signals.totalClaimCount > 0 && signals.unverifiedClaimCount === 0) {
      await transitionStage(db, claim.projectId, "CLAIMS_VERIFIED", "SYSTEM", "Next Action Engine", "All claims resolved.");
    }
  }
  return claim;
}

export async function approveScript(
  db: Database,
  projectId: string,
  scriptId: string,
  approvedBy = "User",
  overrideUnverified = false,
  overrideReason?: string,
) {
  const signals = await computeProjectSignals(db, projectId);
  if (signals.unverifiedClaimCount > 0 && !overrideUnverified) {
    throw new Error(
      `Cannot approve script: ${signals.unverifiedClaimCount} claim(s) are still UNVERIFIED. Resolve them or explicitly override with a reason.`,
    );
  }

  await db
    .update(schema.scripts)
    .set({ status: "APPROVED", approvedAt: new Date(), approvedBy, overrodeUnverifiedClaims: overrideUnverified, updatedAt: new Date() })
    .where(eq(schema.scripts.id, scriptId));

  if (overrideUnverified) {
    await db
      .update(schema.projects)
      .set({ claimOverrideAt: new Date(), claimOverrideReason: overrideReason, updatedAt: new Date() })
      .where(eq(schema.projects.id, projectId));
  }

  await transitionStage(db, projectId, "SCRIPT_APPROVED", "USER", approvedBy, overrideUnverified ? `Approved with override: ${overrideReason}` : undefined);
  await logActivity(
    db,
    projectId,
    "USER",
    "SCRIPT_APPROVED",
    overrideUnverified
      ? `Script approved by ${approvedBy} with an explicit override of ${signals.unverifiedClaimCount} unverified claim(s).`
      : `Script approved by ${approvedBy}.`,
  );
}

export async function markAssetReady(db: Database, assetId: string, localPath?: string) {
  const [asset] = await db
    .update(schema.assets)
    .set({ status: "READY", localPath, updatedAt: new Date() })
    .where(eq(schema.assets.id, assetId))
    .returning();
  if (!asset) throw new Error(`Asset ${assetId} not found`);
  await db.update(schema.assetRequirements).set({ status: "READY", updatedAt: new Date() }).where(eq(schema.assetRequirements.assetId, assetId));
  await logActivity(db, asset.projectId, "USER", "ASSET_READY", `Asset ${asset.filename} marked ready.`);
  return asset;
}

export async function approveFinalRender(db: Database, projectId: string, approvedBy = "User") {
  await db.update(schema.projects).set({ finalRenderApprovedAt: new Date(), updatedAt: new Date() }).where(eq(schema.projects.id, projectId));
  await logActivity(db, projectId, "USER", "FINAL_RENDER_APPROVED", `Final render approved by ${approvedBy}.`);
}

export async function approveAndPublish(db: Database, projectId: string, youtubeVideoId: string | undefined, approvedBy = "User") {
  await db
    .update(schema.projects)
    .set({ publishedAt: new Date(), youtubeVideoId, updatedAt: new Date() })
    .where(eq(schema.projects.id, projectId));
  await transitionStage(db, projectId, "PUBLISHED", "USER", approvedBy);
  await logActivity(db, projectId, "USER", "PUBLISHED", `Project published by ${approvedBy}.`);
}
