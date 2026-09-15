import { STAGE_LABELS, type Stage } from "@yaos/shared";
import { Badge } from "./badge";

const LATE_STAGES: Stage[] = ["PUBLISHED", "ANALYTICS_REVIEWED"];
const RENDER_STAGES: Stage[] = ["ROUGH_RENDERED", "FINAL_RENDERED", "EDIT_PLAN_READY"];

export function StageChip({ stage }: { stage: Stage }) {
  const variant = LATE_STAGES.includes(stage) ? "success" : RENDER_STAGES.includes(stage) ? "purple" : "cyan";
  return <Badge variant={variant}>{STAGE_LABELS[stage]}</Badge>;
}

const CLAIM_VARIANTS: Record<string, "success" | "cyan" | "purple" | "default" | "danger"> = {
  FACT: "success",
  OUR_TEST: "cyan",
  COMMUNITY: "purple",
  OPINION: "default",
  UNVERIFIED: "danger",
};

export function ClaimTypeBadge({ claimType }: { claimType: string }) {
  return <Badge variant={CLAIM_VARIANTS[claimType] ?? "default"}>{claimType.replace("_", " ")}</Badge>;
}
