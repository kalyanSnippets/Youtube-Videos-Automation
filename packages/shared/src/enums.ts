import type { ContentType } from "./stages";

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

/**
 * How much the creator appears on camera for a project. Configurable per
 * project - the system must never hard-code a faceless assumption, nor
 * assume a face-led/hybrid project can't have long faceless stretches.
 */
export const PRESENTATION_MODES = ["FACE_LED", "HYBRID", "FACELESS"] as const;
export type PresentationMode = (typeof PRESENTATION_MODES)[number];

export const PRESENTATION_MODE_LABELS: Record<PresentationMode, string> = {
  FACE_LED: "Face-led",
  HYBRID: "Hybrid",
  FACELESS: "Faceless",
};

export const PRESENTATION_MODE_DESCRIPTIONS: Record<PresentationMode, string> = {
  FACE_LED: "Creator appears on camera through most of the video - talking-head hook, explanation, reactions, verdict.",
  HYBRID: "Creator appears where human presence adds trust or personality; screen recordings and graphics carry the rest.",
  FACELESS: "No on-camera footage required - narration, screen recordings, product outputs, and graphics carry the video.",
};

/** The default presentation mode for a new project when nothing overrides it - this channel's spec calls HYBRID the likely default. */
export const DEFAULT_PRESENTATION_MODE: PresentationMode = "HYBRID";

/**
 * What a single production segment actually is. A scene's segmentType
 * drives which fields the Production Director fills in (on-camera fields
 * only make sense for ON_CAMERA) and which Remotion/editing treatment the
 * Edit Director picks.
 */
export const SEGMENT_TYPES = [
  "ON_CAMERA",
  "VOICEOVER",
  "SCREEN_RECORDING",
  "PRODUCT_RESULT",
  "B_ROLL",
  "MOTION_GRAPHIC",
  "SCREENSHOT",
] as const;
export type SegmentType = (typeof SEGMENT_TYPES)[number];

export const SEGMENT_TYPE_LABELS: Record<SegmentType, string> = {
  ON_CAMERA: "On Camera",
  VOICEOVER: "Voiceover",
  SCREEN_RECORDING: "Screen Recording",
  PRODUCT_RESULT: "Product Result",
  B_ROLL: "B-Roll",
  MOTION_GRAPHIC: "Motion Graphic",
  SCREENSHOT: "Screenshot",
};

/** Which segment types a presentation mode is allowed to use for its narrative beats - never a hard requirement, just what the Production Director should reach for first. */
export const PRESENTATION_MODE_SEGMENT_PRIORITY: Record<PresentationMode, SegmentType[]> = {
  FACE_LED: ["ON_CAMERA", "SCREEN_RECORDING", "PRODUCT_RESULT", "VOICEOVER", "B_ROLL", "MOTION_GRAPHIC", "SCREENSHOT"],
  HYBRID: ["ON_CAMERA", "SCREEN_RECORDING", "PRODUCT_RESULT", "VOICEOVER", "MOTION_GRAPHIC", "SCREENSHOT", "B_ROLL"],
  // Deliberately excludes ON_CAMERA - a FACELESS project should never require on-camera footage.
  FACELESS: ["VOICEOVER", "SCREEN_RECORDING", "PRODUCT_RESULT", "MOTION_GRAPHIC", "SCREENSHOT", "B_ROLL"],
};

/**
 * Suggests a starting presentation mode from a project's content type. This
 * is only ever a recommendation - the creator can override it per project
 * at any time (see the New Video wizard) - and it deliberately never
 * returns FACE_LED, since nothing about a content type alone should force
 * heavy on-camera time; it's HYBRID (personal framing + demonstration) or
 * FACELESS (pure evidence/explainer) depending on how personality-driven
 * the format typically is.
 */
export function recommendPresentationMode(contentType: ContentType): PresentationMode {
  switch (contentType) {
    case "opinion":
    case "news_reaction":
      // Opinion and reaction content leans on the creator's own take - hybrid keeps that
      // personal framing while still cutting to evidence/screen recordings.
      return "HYBRID";
    case "experiment":
    case "comparison":
    case "build":
    case "case_study":
      // "I tested/built/compared" formats live and die on visible proof - hybrid by default.
      return "HYBRID";
    case "tutorial":
    case "explainer":
      // Step-by-step formats are usually clearer without a talking head competing for attention.
      return "FACELESS";
    default:
      return DEFAULT_PRESENTATION_MODE;
  }
}

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
