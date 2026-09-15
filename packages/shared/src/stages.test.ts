import { describe, expect, it } from "vitest";
import { calculateProgress, canTransition, getNextStage, getRequiredStages } from "./stages";

describe("state machine", () => {
  it("requires METHODOLOGY_READY for comparison content before SCRIPT_DRAFTED", () => {
    expect(getRequiredStages("comparison")).toContain("METHODOLOGY_READY");
    expect(getNextStage("CLAIMS_VERIFIED", "comparison")).toBe("METHODOLOGY_READY");
    expect(canTransition("CLAIMS_VERIFIED", "SCRIPT_DRAFTED", "comparison")).toBe(false);
    expect(canTransition("CLAIMS_VERIFIED", "METHODOLOGY_READY", "comparison")).toBe(true);
    expect(canTransition("METHODOLOGY_READY", "SCRIPT_DRAFTED", "comparison")).toBe(true);
  });

  it("skips METHODOLOGY_READY entirely for a tutorial", () => {
    expect(getRequiredStages("tutorial")).not.toContain("METHODOLOGY_READY");
    expect(getNextStage("CLAIMS_VERIFIED", "tutorial")).toBe("SCRIPT_DRAFTED");
    expect(canTransition("CLAIMS_VERIFIED", "SCRIPT_DRAFTED", "tutorial")).toBe(true);
    expect(canTransition("CLAIMS_VERIFIED", "METHODOLOGY_READY", "tutorial")).toBe(false);
  });

  it("rejects skipping multiple stages forward", () => {
    expect(canTransition("IDEA_RESEARCH", "SCRIPT_DRAFTED", "explainer")).toBe(false);
  });

  it("allows documented revision edges", () => {
    expect(canTransition("SCRIPT_APPROVED", "SCRIPT_DRAFTED", "explainer")).toBe(true);
    expect(canTransition("QA_COMPLETE", "EDIT_PLAN_READY", "explainer")).toBe(true);
  });

  it("never allows a no-op transition", () => {
    expect(canTransition("SCRIPT_DRAFTED", "SCRIPT_DRAFTED", "explainer")).toBe(false);
  });

  it("computes weighted progress relative to only the required stages", () => {
    expect(calculateProgress("ANALYTICS_REVIEWED", "tutorial")).toBe(100);
    expect(calculateProgress("ANALYTICS_REVIEWED", "comparison")).toBe(100);
    expect(calculateProgress("IDEA_RESEARCH", "tutorial")).toBeGreaterThan(0);
    // Progress strictly increases as a tutorial project advances through its required stages.
    const atIdea = calculateProgress("IDEA_RESEARCH", "tutorial");
    const atScript = calculateProgress("SCRIPT_DRAFTED", "tutorial");
    const atPublished = calculateProgress("PUBLISHED", "tutorial");
    expect(atIdea).toBeLessThan(atScript);
    expect(atScript).toBeLessThan(atPublished);
  });
});
