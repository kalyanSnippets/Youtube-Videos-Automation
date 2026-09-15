export const CLAIM_TYPES = ["FACT", "OUR_TEST", "COMMUNITY", "OPINION", "UNVERIFIED"] as const;
export type ClaimType = (typeof CLAIM_TYPES)[number];

export const CLAIM_TYPE_LABELS: Record<ClaimType, string> = {
  FACT: "Fact",
  OUR_TEST: "Our Test",
  COMMUNITY: "Community",
  OPINION: "Opinion",
  UNVERIFIED: "Unverified",
};

export const ASSET_STATUSES = [
  "MISSING",
  "READY",
  "GENERATING",
  "NEEDS_RECAPTURE",
  "PROCESSING",
  "INVALID",
] as const;
export type AssetStatus = (typeof ASSET_STATUSES)[number];

export const JOB_STATUSES = [
  "QUEUED",
  "RUNNING",
  "WAITING_FOR_USER",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const ACTOR_TYPES = ["USER", "AGENT", "SYSTEM", "LOCAL_WORKER"] as const;
export type ActorType = (typeof ACTOR_TYPES)[number];

export const INTEGRATION_STATUSES = [
  "NOT_CONNECTED",
  "CONNECTED",
  "DEGRADED",
  "ERROR",
  "COMING_SOON",
] as const;
export type IntegrationStatus = (typeof INTEGRATION_STATUSES)[number];

export const INTEGRATION_SERVICES = [
  "OPENAI",
  "ANTHROPIC",
  "WEB_RESEARCH",
  "YOUTUBE_DATA",
  "YOUTUBE_ANALYTICS",
  "FILE_STORAGE",
  "LOCAL_WORKER",
  "WHISPER",
  "FFMPEG",
  "REMOTION",
] as const;
export type IntegrationService = (typeof INTEGRATION_SERVICES)[number];

export const AGENT_NAMES = [
  "ORCHESTRATOR",
  "IDEA_RESEARCH",
  "COMPETITOR_ANALYST",
  "TRUST_CLAIMS_RESEARCHER",
  "COMMUNITY_CONSENSUS",
  "EXPERIMENT_DESIGNER",
  "STORY_WRITER",
  "PRODUCTION_DIRECTOR",
  "ASSET_PLANNER",
  "ASSET_VALIDATOR",
  "MOTION_DIRECTOR",
  "EDIT_DIRECTOR",
  "VIDEO_CRITIC",
  "PUBLISHING_STRATEGIST",
  "ANALYTICS_REVIEWER",
] as const;
export type AgentName = (typeof AGENT_NAMES)[number];

export const ASSET_PRIORITY_ORDER = [
  "REAL_SCREEN_RECORDING",
  "ACTUAL_GENERATED_OUTPUT",
  "PRIMARY_EVIDENCE_SCREENSHOT",
  "MOTION_GRAPHIC",
  "AI_BROLL",
  "GENERIC_STOCK",
] as const;
export type AssetPriority = (typeof ASSET_PRIORITY_ORDER)[number];

/** Trust coverage: percentage of claims that are NOT unverified. Script approval is blocked below 100% unless overridden. */
export function calculateTrustCoverage(claims: { claimType: ClaimType }[]): number {
  if (claims.length === 0) return 100;
  const unverified = claims.filter((c) => c.claimType === "UNVERIFIED").length;
  return Math.round(((claims.length - unverified) / claims.length) * 100);
}
