import { randomUUID } from "node:crypto";
import { schema } from "@yaos/database";
import type { Database } from "@yaos/database";
import { ProductionSceneSchema, safeValidate, type ProductionScene } from "@yaos/agent-schemas";
import type { AIProviderId } from "@yaos/ai-providers";
import { mockProductionScenes } from "../mock-fixtures";
import { parseJsonLoose } from "../parse-json";
import { runAgent, logActivity } from "../run-agent";

export interface RunProductionDirectorInput {
  db: Database;
  projectId: string;
  scriptId: string;
  topic: string;
  preferredProvider?: AIProviderId;
}

export async function runProductionDirector({ db, projectId, scriptId, topic, preferredProvider }: RunProductionDirectorInput) {
  const { value } = await runAgent({
    db,
    projectId,
    agentName: "PRODUCTION_DIRECTOR",
    preferredProvider,
    userPrompt: `Convert the approved script for "${topic}" into scene-by-scene production instructions.`,
    inputSummary: `scriptId=${scriptId}`,
    build: (rawText, providerId) => (providerId === "MOCK" ? { scenes: mockProductionScenes(topic) } : (parseJsonLoose(rawText) as { scenes: ProductionScene[] })),
    validate: (value) => {
      for (const s of value.scenes) {
        const result = safeValidate(ProductionSceneSchema, s);
        if (!result.success) return { success: false, error: result.error };
      }
      return { success: true };
    },
    outputSummaryOf: (value) => `${value.scenes.length} production scenes generated`,
  });

  const rows = value.scenes.map((s) => ({
    id: randomUUID(),
    projectId,
    scriptId,
    sceneNumber: s.sceneNumber,
    timeEstimateSeconds: s.timeEstimateSeconds,
    narration: s.narration,
    storyPurpose: s.storyPurpose,
    viewerMustSee: s.viewerMustSee,
    whyThisVisual: s.whyThisVisual,
    claimIds: s.claimIds,
    proofRequired: s.proofRequired,
    assetType: s.assetType,
    assetFilename: s.assetFilename,
    toolToUse: s.toolToUse,
    captureOrGenerationSteps: s.captureOrGenerationSteps,
    exactGenerationPrompt: s.exactGenerationPrompt,
    screenRecordingInstructions: s.screenRecordingInstructions,
    privacyWarnings: s.privacyWarnings,
    motionComponent: s.motionComponent,
    motionIntensity: s.motionIntensity,
    onScreenText: s.onScreenText,
    captionEmphasis: s.captionEmphasis,
    sfx: s.sfx,
    transition: s.transition,
    editorInstruction: s.editorInstruction,
    fallbackIfAssetMissing: s.fallbackIfAssetMissing,
  }));

  const inserted = await db.insert(schema.productionScenes).values(rows).returning();
  await logActivity(db, projectId, "AGENT", "PRODUCTION_PLAN_GENERATED", `${inserted.length} production scenes generated.`);
  return inserted;
}
