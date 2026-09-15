import { eq } from "drizzle-orm";
import { db, schema } from "@yaos/database";
import { computeProjectSignals } from "@yaos/agents";
import { calculateProgress, calculateTrustCoverage, resolveNextAction, getRequiredStages } from "@yaos/shared";
import { notFound } from "next/navigation";

export async function getProjectDetail(projectId: string) {
  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, projectId));
  if (!project) notFound();

  const signals = await computeProjectSignals(db, projectId);
  const progress = calculateProgress(project.currentStage, project.contentType);
  const nextAction = resolveNextAction(project.currentStage, project.contentType, signals);
  const claims = await db.select().from(schema.claims).where(eq(schema.claims.projectId, projectId));
  const trustCoveragePercent = calculateTrustCoverage(claims);
  const requiredStages = getRequiredStages(project.contentType);
  const assets = await db.select().from(schema.assets).where(eq(schema.assets.projectId, projectId));
  const arollShots = await db.select().from(schema.arollShots).where(eq(schema.arollShots.projectId, projectId));
  const totalTrackedItems = assets.length + arollShots.length;
  const readyItems = assets.filter((a) => a.status === "READY").length + arollShots.filter((s) => s.status === "READY").length;
  const assetsReadyPercent = totalTrackedItems === 0 ? 0 : Math.round((readyItems / totalTrackedItems) * 100);

  return { project, signals, progress, nextAction, trustCoveragePercent, requiredStages, assetsReadyPercent, claims, assets, arollShots };
}

export type ProjectDetail = Awaited<ReturnType<typeof getProjectDetail>>;
