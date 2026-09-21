import { cache } from "react";
import { eq } from "drizzle-orm";
import { db, schema } from "@yaos/database";
import { computeProjectSignals } from "@yaos/agents";
import { calculateProgress, calculateTrustCoverage, resolveNextAction, getRequiredStages } from "@yaos/shared";
import { notFound } from "next/navigation";

// cache() dedupes this across the [id] layout and whichever tab page renders alongside it in the
// same request - both call getProjectDetail(id) independently, and without this they'd each pay
// for their own signals/claims/assets round trips instead of sharing one.
export const getProjectDetail = cache(async (projectId: string) => {
  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, projectId));
  if (!project) notFound();

  const [signals, claims, assets, arollShots] = await Promise.all([
    computeProjectSignals(db, projectId),
    db.select().from(schema.claims).where(eq(schema.claims.projectId, projectId)),
    db.select().from(schema.assets).where(eq(schema.assets.projectId, projectId)),
    db.select().from(schema.arollShots).where(eq(schema.arollShots.projectId, projectId)),
  ]);
  const progress = calculateProgress(project.currentStage, project.contentType);
  const nextAction = resolveNextAction(project.currentStage, project.contentType, signals);
  const trustCoveragePercent = calculateTrustCoverage(claims);
  const requiredStages = getRequiredStages(project.contentType);
  const totalTrackedItems = assets.length + arollShots.length;
  const readyItems = assets.filter((a) => a.status === "READY").length + arollShots.filter((s) => s.status === "READY").length;
  const assetsReadyPercent = totalTrackedItems === 0 ? 0 : Math.round((readyItems / totalTrackedItems) * 100);

  return { project, signals, progress, nextAction, trustCoveragePercent, requiredStages, assetsReadyPercent, claims, assets, arollShots };
});

export type ProjectDetail = Awaited<ReturnType<typeof getProjectDetail>>;
