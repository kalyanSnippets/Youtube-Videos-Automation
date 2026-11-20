import { and, desc, eq } from "drizzle-orm";
import { schema, type Database } from "@yaos/database";
import { runIdeaResearch } from "./runners/idea-research";
import { runCompetitorAnalysis } from "./runners/competitor-analysis";
import { runClaimsResearch } from "./runners/claims";
import { runExperimentDesigner } from "./runners/methodology";
import { runStoryWriter } from "./runners/story";
import { runProductionDirector } from "./runners/production";
import { runAssetPlanner } from "./runners/assets";
import { transitionStage } from "./domain";

/**
 * One background step of the Start New Video pipeline. The web app hands these to a Netlify
 * background function (15 minute limit) because a real model call takes far longer than a
 * normal request is allowed to run.
 */
export const AGENT_STEPS = ["ideas", "references", "claims", "methodology", "script", "production", "assets"] as const;
export type AgentStep = (typeof AGENT_STEPS)[number];

export function isAgentStep(value: unknown): value is AgentStep {
  return typeof value === "string" && (AGENT_STEPS as readonly string[]).includes(value);
}

/** Pages that show this step's results, for revalidation after a local run. */
export const STEP_PATHS: Record<AgentStep, string[]> = {
  ideas: ["ideas"],
  references: ["references"],
  claims: ["claims"],
  methodology: ["methodology"],
  script: ["script"],
  production: ["production"],
  assets: ["shot-list", "assets"],
};

/** The agent_runs.agent_name each step writes. */
export const STEP_AGENT = {
  ideas: "IDEA_RESEARCH",
  references: "COMPETITOR_ANALYST",
  claims: "TRUST_CLAIMS_RESEARCHER",
  methodology: "EXPERIMENT_DESIGNER",
  script: "STORY_WRITER",
  production: "PRODUCTION_DIRECTOR",
  assets: "ASSET_PLANNER",
} as const satisfies Record<AgentStep, string>;

/**
 * Record that a step was asked for, so the page shows "starting" (and refreshes itself) in the
 * seconds before the background function creates the real run row.
 */
export async function markAgentStepQueued(db: Database, projectId: string, step: AgentStep): Promise<void> {
  await db.insert(schema.agentRuns).values({ projectId, agentName: STEP_AGENT[step], status: "QUEUED", inputSummary: "Waiting to start" });
}

export async function runAgentStep(db: Database, projectId: string, step: AgentStep): Promise<void> {
  try {
    await runStep(db, projectId, step);
  } finally {
    // The real run row has taken over (or the step failed before creating one): drop the placeholder.
    await db
      .delete(schema.agentRuns)
      .where(and(eq(schema.agentRuns.projectId, projectId), eq(schema.agentRuns.agentName, STEP_AGENT[step]), eq(schema.agentRuns.status, "QUEUED")))
      .catch(() => undefined);
  }
}

async function runStep(db: Database, projectId: string, step: AgentStep): Promise<void> {
  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, projectId));
  if (!project) throw new Error(`Project ${projectId} not found`);
  const topic = project.seedIdea || project.title;

  switch (step) {
    case "ideas":
      await runIdeaResearch({ db, projectId, topic });
      return;
    case "references":
      await runCompetitorAnalysis({ db, projectId, topic });
      if (project.currentStage === "IDEA_SELECTED") {
        await transitionStage(db, projectId, "REFERENCES_ANALYSED", "AGENT", "Competitor Analyst");
      }
      return;
    case "claims":
      await runClaimsResearch({ db, projectId, topic });
      return;
    case "methodology":
      await runExperimentDesigner({ db, projectId, topic });
      return;
    case "script":
      await runStoryWriter({ db, projectId, topic });
      return;
    case "production": {
      const [approved] = await db
        .select()
        .from(schema.scripts)
        .where(and(eq(schema.scripts.projectId, projectId), eq(schema.scripts.status, "APPROVED")))
        .orderBy(desc(schema.scripts.version))
        .limit(1);
      if (!approved) throw new Error("No approved script found.");
      await runProductionDirector({ db, projectId, scriptId: approved.id, topic });
      if (project.currentStage === "SCRIPT_APPROVED") {
        await transitionStage(db, projectId, "PRODUCTION_PLAN_READY", "AGENT", "Production Director");
      }
      return;
    }
    case "assets":
      await runAssetPlanner({ db, projectId, topic });
      if (project.currentStage === "PRODUCTION_PLAN_READY") {
        await transitionStage(db, projectId, "ASSETS_REQUESTED", "AGENT", "Asset Planner");
      }
      return;
  }
}
