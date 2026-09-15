import { describe, expect, it } from "vitest";
import { resolveNextAction, type ProjectSignals } from "./next-action";

const baseSignals: ProjectSignals = {
  ideaCandidateCount: 0,
  hasSelectedIdea: false,
  referenceVideoCount: 0,
  totalClaimCount: 0,
  unverifiedClaimCount: 0,
  methodologyRequired: false,
  methodologyDefined: false,
  latestScriptStatus: null,
  productionSceneCount: 0,
  shotListItemCount: 0,
  totalAssetCount: 0,
  missingAssetCount: 0,
  arollShotCount: 0,
  missingArollShotCount: 0,
  narrationUploaded: false,
  transcriptReady: false,
  editPlanReady: false,
  localWorkerConnected: false,
  roughRenderStatus: "none",
  openQaIssueCount: 0,
  finalRenderStatus: "none",
  finalRenderApproved: false,
  publishPackageReady: false,
  published: false,
  analyticsReviewed: false,
};

describe("next action engine", () => {
  it("asks the user to select an idea once ideas exist", () => {
    const action = resolveNextAction("IDEA_RESEARCH", "explainer", { ...baseSignals, ideaCandidateCount: 12 });
    expect(action.kind).toBe("select_idea");
    expect(action.label).toContain("12");
    expect(action.blocking).toBe(true);
  });

  it("blocks script approval while unverified claims remain", () => {
    const action = resolveNextAction("SCRIPT_DRAFTED", "explainer", { ...baseSignals, unverifiedClaimCount: 3 });
    expect(action.kind).toBe("review_claims");
    expect(action.blocking).toBe(true);
  });

  it("requires methodology before drafting the script when required and undefined", () => {
    const action = resolveNextAction("CLAIMS_VERIFIED", "comparison", { ...baseSignals, methodologyRequired: true, methodologyDefined: false });
    expect(action.kind).toBe("define_methodology");
  });

  it("moves straight to script drafting once methodology is defined", () => {
    const action = resolveNextAction("CLAIMS_VERIFIED", "comparison", { ...baseSignals, methodologyRequired: true, methodologyDefined: true });
    expect(action.kind).toBe("draft_script");
  });

  it("surfaces the missing asset count as a blocking action", () => {
    const action = resolveNextAction("ASSETS_REQUESTED", "explainer", { ...baseSignals, missingAssetCount: 5 });
    expect(action.blocking).toBe(true);
    expect(action.label).toContain("5");
  });

  it("also surfaces missing A-roll shots for a HYBRID/FACE_LED project", () => {
    const action = resolveNextAction("ASSETS_REQUESTED", "comparison", { ...baseSignals, missingAssetCount: 2, missingArollShotCount: 3 });
    expect(action.blocking).toBe(true);
    expect(action.label).toContain("2 missing asset");
    expect(action.label).toContain("3 A-roll shot");
  });

  it("requires final render approval even when QA is clean", () => {
    const action = resolveNextAction("QA_COMPLETE", "explainer", { ...baseSignals, openQaIssueCount: 0 });
    expect(action.kind).toBe("approve_final_render");
    expect(action.requiresApproval).toBe(true);
  });
});
