import { describe, expect, it } from "vitest";
import {
  calculateTrustCoverage,
  PRESENTATION_MODES,
  PRESENTATION_MODE_SEGMENT_PRIORITY,
  recommendPresentationMode,
  SEGMENT_TYPES,
} from "./enums";

describe("calculateTrustCoverage", () => {
  it("is 100% for an empty claim ledger (nothing to distrust yet)", () => {
    expect(calculateTrustCoverage([])).toBe(100);
  });

  it("is 100% when no claim is UNVERIFIED", () => {
    expect(
      calculateTrustCoverage([{ claimType: "FACT" }, { claimType: "OPINION" }, { claimType: "COMMUNITY" }]),
    ).toBe(100);
  });

  it("drops proportionally to unverified claims", () => {
    expect(calculateTrustCoverage([{ claimType: "FACT" }, { claimType: "UNVERIFIED" }])).toBe(50);
  });

  it("is 0% when every claim is unverified", () => {
    expect(calculateTrustCoverage([{ claimType: "UNVERIFIED" }, { claimType: "UNVERIFIED" }])).toBe(0);
  });
});

describe("presentation modes", () => {
  it("FACE_LED and HYBRID cover every segment type, including ON_CAMERA first", () => {
    expect(new Set(PRESENTATION_MODE_SEGMENT_PRIORITY.FACE_LED)).toEqual(new Set(SEGMENT_TYPES));
    expect(new Set(PRESENTATION_MODE_SEGMENT_PRIORITY.HYBRID)).toEqual(new Set(SEGMENT_TYPES));
    expect(PRESENTATION_MODE_SEGMENT_PRIORITY.FACE_LED[0]).toBe("ON_CAMERA");
    expect(PRESENTATION_MODE_SEGMENT_PRIORITY.HYBRID[0]).toBe("ON_CAMERA");
  });

  it("FACELESS never requires ON_CAMERA footage", () => {
    expect(PRESENTATION_MODE_SEGMENT_PRIORITY.FACELESS).not.toContain("ON_CAMERA");
    expect(PRESENTATION_MODE_SEGMENT_PRIORITY.FACELESS[0]).toBe("VOICEOVER");
  });

  it("every mode is a non-empty, deduplicated list", () => {
    for (const mode of PRESENTATION_MODES) {
      const priority = PRESENTATION_MODE_SEGMENT_PRIORITY[mode];
      expect(priority.length).toBeGreaterThan(0);
      expect(new Set(priority).size).toBe(priority.length);
    }
  });

  it("recommends a mode for every content type without ever forcing FACE_LED", () => {
    const contentTypes = ["experiment", "comparison", "tutorial", "build", "opinion", "news_reaction", "case_study", "explainer"] as const;
    for (const type of contentTypes) {
      const recommended = recommendPresentationMode(type);
      expect(PRESENTATION_MODES).toContain(recommended);
      expect(recommended).not.toBe("FACE_LED");
    }
  });
});
