import { pgEnum } from "drizzle-orm/pg-core";
import {
  STAGES,
  CONTENT_TYPES,
  CLAIM_TYPES,
  ASSET_STATUSES,
  JOB_STATUSES,
  ACTOR_TYPES,
  INTEGRATION_STATUSES,
  INTEGRATION_SERVICES,
  AGENT_NAMES,
} from "@yaos/shared";

export const stageEnum = pgEnum("stage", STAGES);
export const contentTypeEnum = pgEnum("content_type", CONTENT_TYPES);
export const claimTypeEnum = pgEnum("claim_type", CLAIM_TYPES);
export const assetStatusEnum = pgEnum("asset_status", ASSET_STATUSES);
export const jobStatusEnum = pgEnum("job_status", JOB_STATUSES);
export const actorTypeEnum = pgEnum("actor_type", ACTOR_TYPES);
export const integrationStatusEnum = pgEnum("integration_status", INTEGRATION_STATUSES);
export const integrationServiceEnum = pgEnum("integration_service", INTEGRATION_SERVICES);
export const agentNameEnum = pgEnum("agent_name", AGENT_NAMES);

export const jobTypeEnum = pgEnum("job_type", [
  "IDEA_RESEARCH",
  "COMPETITOR_ANALYSIS",
  "CLAIMS_RESEARCH",
  "COMMUNITY_CONSENSUS",
  "METHODOLOGY_DESIGN",
  "SCRIPT_DRAFT",
  "PRODUCTION_PLAN",
  "ASSET_PLAN",
  "ASSET_VALIDATION",
  "NARRATION_PROCESS",
  "TRANSCRIPTION",
  "EDIT_PLAN",
  "RENDER_ROUGH",
  "RENDER_FINAL",
  "VIDEO_QA",
  "PUBLISH_PACKAGE",
  "ANALYTICS_SYNC",
]);

export const referenceRoleEnum = pgEnum("reference_role", ["MASTER_REFERENCE", "SUPPORTING"]);

export const consensusSentimentEnum = pgEnum("consensus_sentiment", [
  "STRONGLY_POSITIVE",
  "MOSTLY_POSITIVE",
  "MIXED",
  "MOSTLY_NEGATIVE",
  "WEAK_CONSENSUS",
]);

export const qaSeverityEnum = pgEnum("qa_severity", ["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const qaStatusEnum = pgEnum("qa_status", ["OPEN", "ACKNOWLEDGED", "FIXED", "WONT_FIX"]);

export const renderJobTypeEnum = pgEnum("render_job_type", ["ROUGH", "FINAL", "SHORT"]);

export const motionIntensityEnum = pgEnum("motion_intensity", ["LOW", "MEDIUM", "HIGH"]);
