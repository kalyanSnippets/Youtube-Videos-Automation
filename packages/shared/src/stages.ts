/**
 * The canonical project state machine for YouTube Agent OS.
 *
 * A project moves through a fixed sequence of stages. Some stages are
 * optional depending on the project's content type (e.g. METHODOLOGY_READY
 * only applies to experiments/comparisons/case studies). Progress and
 * "next action" are always derived from this module - never hand-rolled
 * elsewhere.
 */

export const STAGES = [
  "IDEA_RESEARCH",
  "IDEA_SELECTED",
  "REFERENCES_ANALYSED",
  "CLAIMS_VERIFIED",
  "METHODOLOGY_READY",
  "SCRIPT_DRAFTED",
  "SCRIPT_APPROVED",
  "PRODUCTION_PLAN_READY",
  "ASSETS_REQUESTED",
  "ASSETS_READY",
  "NARRATION_READY",
  "TRANSCRIPT_READY",
  "EDIT_PLAN_READY",
  "ROUGH_RENDERED",
  "QA_COMPLETE",
  "FINAL_RENDERED",
  "PUBLISH_PACKAGE_READY",
  "PUBLISHED",
  "ANALYTICS_REVIEWED",
] as const;

export type Stage = (typeof STAGES)[number];

export const CONTENT_TYPES = [
  "experiment",
  "comparison",
  "tutorial",
  "build",
  "opinion",
  "news_reaction",
  "case_study",
  "explainer",
] as const;

export type ContentType = (typeof CONTENT_TYPES)[number];

/** Content types for which methodology (defined-before-results test design) is mandatory. */
const METHODOLOGY_REQUIRED_TYPES: ReadonlySet<ContentType> = new Set([
  "experiment",
  "comparison",
  "case_study",
]);

/**
 * Stages that are conditionally skipped depending on content type.
 * Every stage not listed here is required for every content type.
 */
export function isStageOptional(stage: Stage, contentType: ContentType): boolean {
  if (stage === "METHODOLOGY_READY") {
    return !METHODOLOGY_REQUIRED_TYPES.has(contentType);
  }
  return false;
}

export function getRequiredStages(contentType: ContentType): Stage[] {
  return STAGES.filter((stage) => !isStageOptional(stage, contentType));
}

/** Relative weight of each stage toward overall project completion (sums to 100 across all stages). */
export const STAGE_WEIGHTS: Record<Stage, number> = {
  IDEA_RESEARCH: 4,
  IDEA_SELECTED: 3,
  REFERENCES_ANALYSED: 5,
  CLAIMS_VERIFIED: 8,
  METHODOLOGY_READY: 5,
  SCRIPT_DRAFTED: 8,
  SCRIPT_APPROVED: 4,
  PRODUCTION_PLAN_READY: 8,
  ASSETS_REQUESTED: 4,
  ASSETS_READY: 8,
  NARRATION_READY: 5,
  TRANSCRIPT_READY: 4,
  EDIT_PLAN_READY: 8,
  ROUGH_RENDERED: 6,
  QA_COMPLETE: 5,
  FINAL_RENDERED: 6,
  PUBLISH_PACKAGE_READY: 5,
  PUBLISHED: 3,
  ANALYTICS_REVIEWED: 1,
};

/**
 * Compute weighted progress (0-100) for a project's content type given the
 * current stage. Only stages required for this content type count toward
 * the denominator, so a tutorial (no methodology) can reach 100% without it.
 */
export function calculateProgress(currentStage: Stage, contentType: ContentType): number {
  const required = getRequiredStages(contentType);
  const totalWeight = required.reduce((sum, s) => sum + STAGE_WEIGHTS[s], 0);
  const currentIndex = STAGES.indexOf(currentStage);
  const completedWeight = required.reduce((sum, s) => {
    return STAGES.indexOf(s) <= currentIndex ? sum + STAGE_WEIGHTS[s] : sum;
  }, 0);
  if (totalWeight === 0) return 0;
  return Math.round((completedWeight / totalWeight) * 100);
}

/** Explicit revision/back edges: a stage can be reopened for rework. */
const REVISION_EDGES: Partial<Record<Stage, Stage[]>> = {
  SCRIPT_APPROVED: ["SCRIPT_DRAFTED"],
  QA_COMPLETE: ["EDIT_PLAN_READY", "ASSETS_REQUESTED"],
  ROUGH_RENDERED: ["EDIT_PLAN_READY"],
  ASSETS_READY: ["ASSETS_REQUESTED"],
};

/** The next required stage after `current` for this content type, or null if this is the last stage. */
export function getNextStage(current: Stage, contentType: ContentType): Stage | null {
  const required = getRequiredStages(contentType);
  const requiredIndex = required.indexOf(current);
  if (requiredIndex === -1) {
    // current stage is not part of the required path (shouldn't normally happen)
    const globalIndex = STAGES.indexOf(current);
    return STAGES[globalIndex + 1] ?? null;
  }
  return required[requiredIndex + 1] ?? null;
}

/**
 * A forward transition is legal only if `to` is the single next required
 * stage for this content type - this is what makes METHODOLOGY_READY
 * mandatory for a comparison/experiment/case_study (CLAIMS_VERIFIED's next
 * required stage) while a tutorial skips straight from CLAIMS_VERIFIED to
 * SCRIPT_DRAFTED. Backward moves are only legal via the explicit revision
 * edges below (reopening a stage for rework).
 */
export function canTransition(from: Stage, to: Stage, contentType: ContentType): boolean {
  if (from === to) return false;
  if (getNextStage(from, contentType) === to) return true;
  const revision = REVISION_EDGES[from] ?? [];
  return revision.includes(to);
}

export function isRevision(from: Stage, to: Stage): boolean {
  return STAGES.indexOf(to) < STAGES.indexOf(from);
}

export const STAGE_LABELS: Record<Stage, string> = {
  IDEA_RESEARCH: "Idea Research",
  IDEA_SELECTED: "Idea Selected",
  REFERENCES_ANALYSED: "References Analysed",
  CLAIMS_VERIFIED: "Claims Verified",
  METHODOLOGY_READY: "Methodology Ready",
  SCRIPT_DRAFTED: "Script Drafted",
  SCRIPT_APPROVED: "Script Approved",
  PRODUCTION_PLAN_READY: "Production Plan Ready",
  ASSETS_REQUESTED: "Assets Requested",
  ASSETS_READY: "Assets Ready",
  NARRATION_READY: "Narration Ready",
  TRANSCRIPT_READY: "Transcript Ready",
  EDIT_PLAN_READY: "Edit Plan Ready",
  ROUGH_RENDERED: "Rough Rendered",
  QA_COMPLETE: "QA Complete",
  FINAL_RENDERED: "Final Rendered",
  PUBLISH_PACKAGE_READY: "Publish Package Ready",
  PUBLISHED: "Published",
  ANALYTICS_REVIEWED: "Analytics Reviewed",
};
