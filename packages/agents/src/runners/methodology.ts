import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { schema } from "@yaos/database";
import type { Database } from "@yaos/database";
import { MethodologySchema, safeValidate, type Methodology } from "@yaos/agent-schemas";
import type { AIProviderId } from "@yaos/ai-providers";
import { mockMethodology } from "../mock-fixtures";
import { parseJsonLoose } from "../parse-json";
import { runAgent, logActivity } from "../run-agent";
import { transitionStage } from "../domain";

export interface RunExperimentDesignerInput {
  db: Database;
  projectId: string;
  topic: string;
  preferredProvider?: AIProviderId;
}

/**
 * Experiment Designer - defines test methodology BEFORE any results exist.
 * Only meaningful for experiment/comparison/case_study content types; the
 * caller (server action / seed script) is responsible for only invoking
 * this when methodology is actually required for the project.
 */
export async function runExperimentDesigner({ db, projectId, topic, preferredProvider }: RunExperimentDesignerInput) {
  const { value } = await runAgent({
    db,
    projectId,
    agentName: "EXPERIMENT_DESIGNER",
    preferredProvider,
    userPrompt: `Define the test methodology for "${topic}" before any results are entered.`,
    inputSummary: `topic="${topic}"`,
    build: (rawText, providerId) => (providerId === "MOCK" ? mockMethodology(topic) : (parseJsonLoose(rawText) as Methodology)),
    validate: (value) => {
      const result = safeValidate(MethodologySchema, value);
      return result.success ? { success: true } : { success: false, error: result.error };
    },
    outputSummaryOf: (value) => `Methodology locked: ${value.numberOfAttempts} attempts, ${value.scoringMetrics.length} scoring metrics`,
  });

  const [row] = await db
    .insert(schema.methodologies)
    .values({
      id: randomUUID(),
      projectId,
      samePromptOrInput: value.samePromptOrInput,
      numberOfAttempts: value.numberOfAttempts,
      accountTier: value.accountTier,
      locationRegion: value.locationRegion,
      durationNotes: value.durationNotes,
      resolutionNotes: value.resolutionNotes,
      scoringMetrics: value.scoringMetrics,
      inclusionRules: value.inclusionRules,
      exclusionRules: value.exclusionRules,
      tierDefinitions: value.tierDefinitions,
      isLocked: true,
    })
    .returning();

  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, projectId));
  if (project?.currentStage === "CLAIMS_VERIFIED") {
    await transitionStage(db, projectId, "METHODOLOGY_READY", "AGENT", "Experiment Designer");
  }

  await logActivity(db, projectId, "AGENT", "METHODOLOGY_READY", "Methodology locked before any results were entered.");
  return row;
}
