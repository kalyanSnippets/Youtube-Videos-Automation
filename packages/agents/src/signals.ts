import { eq, and } from "drizzle-orm";
import { schema } from "@yaos/database";
import type { Database } from "@yaos/database";
import type { ProjectSignals } from "@yaos/shared";

/**
 * Computes the full ProjectSignals object for a project by querying every
 * table the Next Action Engine cares about. This is the single place that
 * translates raw rows into the counts/booleans resolveNextAction() expects -
 * every UI surface (project card, project detail header) must go through
 * this function rather than re-deriving signals ad hoc.
 */
export async function computeProjectSignals(db: Database, projectId: string): Promise<ProjectSignals> {
  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, projectId));
  if (!project) throw new Error(`Project ${projectId} not found`);

  // Every table here is keyed by projectId (or, for localWorkers, workspaceId) and none of these
  // reads depend on each other's results, so they run concurrently instead of one round trip at a
  // time - sequential awaits here were the single biggest source of page latency in the app, since
  // this function runs once per project shown on the dashboard/projects list.
  const [
    ideas,
    references,
    claims,
    [methodology],
    scripts,
    productionScenes,
    shotListItems,
    assets,
    arollShots,
    transcripts,
    editPlanScenes,
    localWorkers,
    roughRenders,
    finalRenders,
    qaIssues,
    [publishPackage],
    analyticsSnapshots,
  ] = await Promise.all([
    db.select().from(schema.videoIdeas).where(eq(schema.videoIdeas.projectId, projectId)),
    db.select().from(schema.referenceVideos).where(eq(schema.referenceVideos.projectId, projectId)),
    db.select().from(schema.claims).where(eq(schema.claims.projectId, projectId)),
    db.select().from(schema.methodologies).where(eq(schema.methodologies.projectId, projectId)),
    db.select().from(schema.scripts).where(eq(schema.scripts.projectId, projectId)),
    db.select().from(schema.productionScenes).where(eq(schema.productionScenes.projectId, projectId)),
    db.select().from(schema.shotListItems).where(eq(schema.shotListItems.projectId, projectId)),
    db.select().from(schema.assets).where(eq(schema.assets.projectId, projectId)),
    db.select().from(schema.arollShots).where(eq(schema.arollShots.projectId, projectId)),
    db.select().from(schema.transcripts).where(eq(schema.transcripts.projectId, projectId)),
    db.select().from(schema.editPlanScenes).where(eq(schema.editPlanScenes.projectId, projectId)),
    db.select().from(schema.localWorkerNodes).where(eq(schema.localWorkerNodes.workspaceId, project.workspaceId)),
    db.select().from(schema.renderJobs).where(and(eq(schema.renderJobs.projectId, projectId), eq(schema.renderJobs.renderType, "ROUGH"))),
    db.select().from(schema.renderJobs).where(and(eq(schema.renderJobs.projectId, projectId), eq(schema.renderJobs.renderType, "FINAL"))),
    db.select().from(schema.qaIssues).where(eq(schema.qaIssues.projectId, projectId)),
    db.select().from(schema.publishPackages).where(eq(schema.publishPackages.projectId, projectId)),
    db.select().from(schema.analyticsSnapshots).where(eq(schema.analyticsSnapshots.projectId, projectId)),
  ]);
  const narrationAssets = assets.filter((a) => a.category === "narration" || a.subject === "narration");

  function mapRenderStatus(status?: string): "none" | "queued" | "running" | "completed" | "failed" {
    if (!status) return "none";
    if (status === "QUEUED") return "queued";
    if (status === "RUNNING" || status === "WAITING_FOR_USER") return "running";
    if (status === "COMPLETED") return "completed";
    return "failed";
  }

  const latestScript = [...scripts].sort((a, b) => b.version - a.version)[0];
  const latestRough = [...roughRenders].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  const latestFinal = [...finalRenders].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

  return {
    ideaCandidateCount: ideas.length,
    hasSelectedIdea: Boolean(project.selectedIdeaId),
    referenceVideoCount: references.length,
    totalClaimCount: claims.length,
    unverifiedClaimCount: claims.filter((c) => c.claimType === "UNVERIFIED").length,
    methodologyRequired: project.contentType === "experiment" || project.contentType === "comparison" || project.contentType === "case_study",
    methodologyDefined: Boolean(methodology),
    latestScriptStatus: !latestScript ? "none" : latestScript.status === "APPROVED" ? "approved" : "draft",
    productionSceneCount: productionScenes.length,
    shotListItemCount: shotListItems.length,
    totalAssetCount: assets.length,
    missingAssetCount: assets.filter((a) => a.status === "MISSING" || a.status === "NEEDS_RECAPTURE").length,
    arollShotCount: arollShots.length,
    missingArollShotCount: arollShots.filter((a) => a.status === "MISSING" || a.status === "NEEDS_RECAPTURE").length,
    narrationUploaded: narrationAssets.some((a) => a.status === "READY"),
    transcriptReady: transcripts.length > 0,
    editPlanReady: editPlanScenes.length > 0,
    localWorkerConnected: localWorkers.some((w) => w.isOnline),
    roughRenderStatus: mapRenderStatus(latestRough?.status),
    openQaIssueCount: qaIssues.filter((q) => q.status === "OPEN").length,
    finalRenderStatus: mapRenderStatus(latestFinal?.status),
    finalRenderApproved: Boolean(project.finalRenderApprovedAt),
    publishPackageReady: Boolean(publishPackage),
    published: Boolean(project.publishedAt),
    analyticsReviewed: analyticsSnapshots.some((a) => a.postmortem),
  };
}
