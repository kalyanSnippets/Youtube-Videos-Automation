export * from "./types";
import { orchestratorV1 } from "./orchestrator/v1";
import { ideaResearchV1 } from "./idea-research/v1";
import { competitorAnalysisV1 } from "./competitor-analysis/v1";
import { claimsV1 } from "./claims/v1";
import { storyV1 } from "./story/v1";
import { productionV1 } from "./production/v1";
import { assetsV1 } from "./assets/v1";
import { editDirectorV1 } from "./edit-director/v1";
import { videoCriticV1 } from "./video-critic/v1";
import { publishV1 } from "./publish/v1";
import { analyticsV1 } from "./analytics/v1";
import type { PromptVersion } from "./types";
import { getActivePrompt } from "./types";

export const PROMPT_REGISTRY: Record<string, PromptVersion[]> = {
  ORCHESTRATOR: [orchestratorV1],
  IDEA_RESEARCH: [ideaResearchV1],
  COMPETITOR_ANALYST: [competitorAnalysisV1],
  TRUST_CLAIMS_RESEARCHER: [claimsV1],
  STORY_WRITER: [storyV1],
  PRODUCTION_DIRECTOR: [productionV1],
  ASSET_PLANNER: [assetsV1],
  EDIT_DIRECTOR: [editDirectorV1],
  VIDEO_CRITIC: [videoCriticV1],
  PUBLISHING_STRATEGIST: [publishV1],
  ANALYTICS_REVIEWER: [analyticsV1],
};

export function getPromptForAgent(agent: string): PromptVersion {
  const versions = PROMPT_REGISTRY[agent];
  if (!versions || versions.length === 0) {
    throw new Error(`No prompt registered for agent "${agent}"`);
  }
  return getActivePrompt(versions);
}
