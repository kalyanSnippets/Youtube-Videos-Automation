import type { ContentType, Stage } from "./stages";

/**
 * Everything the Next Action Engine needs to know about a project's current
 * data in order to compute the single next action. All fields are simple
 * counts/booleans so this stays framework-agnostic (no DB types leak in).
 */
export interface ProjectSignals {
  ideaCandidateCount: number;
  hasSelectedIdea: boolean;
  referenceVideoCount: number;
  totalClaimCount: number;
  unverifiedClaimCount: number;
  methodologyRequired: boolean;
  methodologyDefined: boolean;
  latestScriptStatus: "none" | "draft" | "approved" | null;
  productionSceneCount: number;
  shotListItemCount: number;
  totalAssetCount: number;
  missingAssetCount: number;
  narrationUploaded: boolean;
  transcriptReady: boolean;
  editPlanReady: boolean;
  localWorkerConnected: boolean;
  roughRenderStatus: "none" | "queued" | "running" | "completed" | "failed";
  openQaIssueCount: number;
  finalRenderStatus: "none" | "queued" | "running" | "completed" | "failed";
  finalRenderApproved: boolean;
  publishPackageReady: boolean;
  published: boolean;
  analyticsReviewed: boolean;
}

export type NextActionKind =
  | "select_idea"
  | "add_references"
  | "review_claims"
  | "define_methodology"
  | "draft_script"
  | "approve_script"
  | "generate_production_plan"
  | "resolve_missing_assets"
  | "upload_narration"
  | "connect_local_worker"
  | "run_transcription"
  | "build_edit_plan"
  | "render_rough_cut"
  | "review_rough_cut"
  | "resolve_qa_issues"
  | "approve_final_render"
  | "build_publish_package"
  | "approve_publish"
  | "review_analytics"
  | "run_agent"
  | "done";

export interface NextAction {
  kind: NextActionKind;
  label: string;
  blocking: boolean;
  requiresApproval: boolean;
}

export function resolveNextAction(
  stage: Stage,
  _contentType: ContentType,
  s: ProjectSignals,
): NextAction {
  switch (stage) {
    case "IDEA_RESEARCH":
      if (s.ideaCandidateCount === 0) {
        return { kind: "run_agent", label: "Run idea research", blocking: false, requiresApproval: false };
      }
      return {
        kind: "select_idea",
        label: `Select one of ${s.ideaCandidateCount} researched ideas`,
        blocking: true,
        requiresApproval: true,
      };
    case "IDEA_SELECTED":
      if (s.referenceVideoCount === 0) {
        return { kind: "run_agent", label: "Analyse reference videos", blocking: false, requiresApproval: false };
      }
      return { kind: "add_references", label: "Confirm reference video analysis", blocking: true, requiresApproval: false };
    case "REFERENCES_ANALYSED":
      if (s.totalClaimCount === 0) {
        return { kind: "run_agent", label: "Run claims & trust research", blocking: false, requiresApproval: false };
      }
      return {
        kind: "review_claims",
        label: `Review ${s.unverifiedClaimCount} unverified claim${s.unverifiedClaimCount === 1 ? "" : "s"}`,
        blocking: s.unverifiedClaimCount > 0,
        requiresApproval: true,
      };
    case "CLAIMS_VERIFIED":
      if (s.unverifiedClaimCount > 0) {
        return {
          kind: "review_claims",
          label: `Review ${s.unverifiedClaimCount} unverified claim${s.unverifiedClaimCount === 1 ? "" : "s"}`,
          blocking: true,
          requiresApproval: true,
        };
      }
      if (s.methodologyRequired && !s.methodologyDefined) {
        return { kind: "define_methodology", label: "Define test methodology before results", blocking: true, requiresApproval: false };
      }
      return { kind: "draft_script", label: "Draft narration script", blocking: false, requiresApproval: false };
    case "METHODOLOGY_READY":
      return { kind: "draft_script", label: "Draft narration script", blocking: false, requiresApproval: false };
    case "SCRIPT_DRAFTED":
      if (s.unverifiedClaimCount > 0) {
        return {
          kind: "review_claims",
          label: `Resolve ${s.unverifiedClaimCount} unverified claim${s.unverifiedClaimCount === 1 ? "" : "s"} before approval`,
          blocking: true,
          requiresApproval: true,
        };
      }
      return { kind: "approve_script", label: "Approve script", blocking: true, requiresApproval: true };
    case "SCRIPT_APPROVED":
      if (s.productionSceneCount === 0) {
        return { kind: "run_agent", label: "Generate production plan", blocking: false, requiresApproval: false };
      }
      return { kind: "generate_production_plan", label: "Review production scenes", blocking: true, requiresApproval: false };
    case "PRODUCTION_PLAN_READY":
      if (s.shotListItemCount === 0) {
        return { kind: "run_agent", label: "Generate shot list", blocking: false, requiresApproval: false };
      }
      return { kind: "resolve_missing_assets", label: "Review shot list and asset requirements", blocking: true, requiresApproval: false };
    case "ASSETS_REQUESTED":
      if (s.missingAssetCount > 0) {
        return {
          kind: "resolve_missing_assets",
          label: `Record or generate ${s.missingAssetCount} missing asset${s.missingAssetCount === 1 ? "" : "s"}`,
          blocking: true,
          requiresApproval: false,
        };
      }
      return { kind: "resolve_missing_assets", label: "Mark assets ready", blocking: true, requiresApproval: false };
    case "ASSETS_READY":
      if (!s.narrationUploaded) {
        return { kind: "upload_narration", label: "Upload narration recording", blocking: true, requiresApproval: false };
      }
      return { kind: "run_agent", label: "Process narration audio", blocking: false, requiresApproval: false };
    case "NARRATION_READY":
      if (!s.localWorkerConnected) {
        return { kind: "connect_local_worker", label: "Connect local render worker to transcribe narration", blocking: true, requiresApproval: false };
      }
      return { kind: "run_transcription", label: "Run word-level transcription", blocking: false, requiresApproval: false };
    case "TRANSCRIPT_READY":
      return { kind: "build_edit_plan", label: "Build AI edit plan", blocking: false, requiresApproval: false };
    case "EDIT_PLAN_READY":
      if (!s.localWorkerConnected) {
        return { kind: "connect_local_worker", label: "Connect local render worker to render rough cut", blocking: true, requiresApproval: false };
      }
      return { kind: "render_rough_cut", label: "Render rough cut", blocking: false, requiresApproval: false };
    case "ROUGH_RENDERED":
      return { kind: "review_rough_cut", label: "Review rough cut", blocking: true, requiresApproval: false };
    case "QA_COMPLETE":
      if (s.openQaIssueCount > 0) {
        return {
          kind: "resolve_qa_issues",
          label: `Resolve ${s.openQaIssueCount} QA issue${s.openQaIssueCount === 1 ? "" : "s"}`,
          blocking: true,
          requiresApproval: false,
        };
      }
      return { kind: "approve_final_render", label: "Approve final render", blocking: true, requiresApproval: true };
    case "FINAL_RENDERED":
      if (!s.finalRenderApproved) {
        return { kind: "approve_final_render", label: "Approve final video", blocking: true, requiresApproval: true };
      }
      return { kind: "build_publish_package", label: "Generate publish package", blocking: false, requiresApproval: false };
    case "PUBLISH_PACKAGE_READY":
      return { kind: "approve_publish", label: "Approve and publish to YouTube", blocking: true, requiresApproval: true };
    case "PUBLISHED":
      return { kind: "review_analytics", label: "Review analytics once data is available", blocking: false, requiresApproval: false };
    case "ANALYTICS_REVIEWED":
      return { kind: "done", label: "Project complete", blocking: false, requiresApproval: false };
    default:
      return { kind: "done", label: "Project complete", blocking: false, requiresApproval: false };
  }
}
