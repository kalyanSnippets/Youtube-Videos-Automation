import { eq, and, isNull, desc } from "drizzle-orm";
import { db, schema } from "@yaos/database";
import { computeProjectSignals } from "@yaos/agents";
import { calculateProgress, calculateTrustCoverage, resolveNextAction, type Stage } from "@yaos/shared";

export interface ProjectSummary {
  id: string;
  title: string;
  slug: string;
  contentType: string;
  currentStage: Stage;
  progress: number;
  nextActionLabel: string;
  isBlocked: boolean;
  requiresApproval: boolean;
  missingAssetCount: number;
  trustCoveragePercent: number;
  isDemo: boolean;
  updatedAt: Date;
  lastActivitySummary: string | null;
  lastActivityAt: Date | null;
}

export async function getProjectSummaries(workspaceId: string, includeArchived = false): Promise<ProjectSummary[]> {
  const projects = await db
    .select()
    .from(schema.projects)
    .where(includeArchived ? eq(schema.projects.workspaceId, workspaceId) : and(eq(schema.projects.workspaceId, workspaceId), isNull(schema.projects.archivedAt)))
    .orderBy(desc(schema.projects.updatedAt));

  const summaries: ProjectSummary[] = [];
  for (const project of projects) {
    const signals = await computeProjectSignals(db, project.id);
    const progress = calculateProgress(project.currentStage, project.contentType);
    const nextAction = resolveNextAction(project.currentStage, project.contentType, signals);
    const claims = await db.select().from(schema.claims).where(eq(schema.claims.projectId, project.id));
    const trustCoveragePercent = calculateTrustCoverage(claims);
    const [lastActivity] = await db
      .select()
      .from(schema.projectActivity)
      .where(eq(schema.projectActivity.projectId, project.id))
      .orderBy(desc(schema.projectActivity.createdAt))
      .limit(1);

    summaries.push({
      id: project.id,
      title: project.title,
      slug: project.slug,
      contentType: project.contentType,
      currentStage: project.currentStage,
      progress,
      nextActionLabel: nextAction.label,
      isBlocked: nextAction.blocking,
      requiresApproval: nextAction.requiresApproval,
      missingAssetCount: signals.missingAssetCount,
      trustCoveragePercent,
      isDemo: project.isDemo,
      updatedAt: project.updatedAt,
      lastActivitySummary: lastActivity?.summary ?? null,
      lastActivityAt: lastActivity?.createdAt ?? null,
    });
  }
  return summaries;
}
