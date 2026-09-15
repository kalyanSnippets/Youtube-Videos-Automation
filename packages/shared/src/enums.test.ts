import { describe, expect, it } from "vitest";
import { calculateTrustCoverage } from "./enums";

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
