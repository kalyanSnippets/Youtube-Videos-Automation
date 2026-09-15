import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { schema } from "@yaos/database";
import type { Database } from "@yaos/database";
import { AssetRequirementSchema, safeValidate, type AssetRequirement } from "@yaos/agent-schemas";
import type { AIProviderId } from "@yaos/ai-providers";
import { mockAssetRequirements } from "../mock-fixtures";
import { parseJsonLoose } from "../parse-json";
import { runAgent, logActivity } from "../run-agent";

export interface RunAssetPlannerInput {
  db: Database;
  projectId: string;
  topic: string;
  preferredProvider?: AIProviderId;
}

export async function runAssetPlanner({ db, projectId, topic, preferredProvider }: RunAssetPlannerInput) {
  const { value } = await runAgent({
    db,
    projectId,
    agentName: "ASSET_PLANNER",
    preferredProvider,
    userPrompt: `Produce the shot list and asset requirements for "${topic}" from the production scenes.`,
    inputSummary: `topic="${topic}"`,
    build: (rawText, providerId) => (providerId === "MOCK" ? { requirements: mockAssetRequirements() } : (parseJsonLoose(rawText) as { requirements: AssetRequirement[] })),
    validate: (value) => {
      for (const r of value.requirements) {
        const result = safeValidate(AssetRequirementSchema, r);
        if (!result.success) return { success: false, error: result.error };
      }
      return { success: true };
    },
    outputSummaryOf: (value) => `${value.requirements.length} asset requirements planned`,
  });

  const productionScenes = await db.select().from(schema.productionScenes).where(eq(schema.productionScenes.projectId, projectId));

  const shotListRows = [];
  const assetRequirementRows = [];
  const assetRows = [];

  for (const req of value.requirements) {
    const matchedScene = productionScenes.find((s) => s.assetFilename === req.expectedFilename);
    const shotListId = randomUUID();
    shotListRows.push({
      id: shotListId,
      projectId,
      productionSceneId: matchedScene?.id,
      shotType: req.shotType,
      filename: req.expectedFilename,
      software: req.software,
      shortcut: req.shortcut,
      windowSetup: req.windowSetup,
      exactSequence: req.exactSequence,
      cursorBehavior: req.cursorBehavior,
      durationSeconds: req.durationSeconds,
      exportFormat: req.exportFormat,
      toolOrModel: req.toolOrModel,
      prompt: req.prompt,
      negativePrompt: req.negativePrompt,
      aspectRatio: req.aspectRatio,
      maxAttempts: req.maxAttempts,
      acceptanceCriteria: req.acceptanceCriteria,
    });
    assetRequirementRows.push({
      id: randomUUID(),
      projectId,
      productionSceneId: matchedScene?.id,
      shotListItemId: shotListId,
      expectedFilename: req.expectedFilename,
      category: req.category,
      status: "MISSING" as const,
      instructions: req.instructions,
    });
    assetRows.push({
      id: randomUUID(),
      projectId,
      filename: req.expectedFilename,
      category: req.category,
      status: "MISSING" as const,
      sourceType: req.shotType === "SCREEN_RECORDING" ? "real_screen_recording" : "ai_broll",
    });
  }

  await db.insert(schema.shotListItems).values(shotListRows);
  await db.insert(schema.assetRequirements).values(assetRequirementRows);
  const insertedAssets = await db.insert(schema.assets).values(assetRows).returning();

  await logActivity(
    db,
    projectId,
    "AGENT",
    "ASSET_PLAN_GENERATED",
    `Shot list and ${insertedAssets.length} asset requirements generated - all currently MISSING.`,
  );

  return { shotListCount: shotListRows.length, assets: insertedAssets };
}
