import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { schema } from "@yaos/database";
import type { Database } from "@yaos/database";
import { ProductionSceneSchema, safeValidate, type ProductionScene } from "@yaos/agent-schemas";
import type { AIProviderId } from "@yaos/ai-providers";
import { mockProductionScenes, mockArollShots } from "../mock-fixtures";
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
  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, projectId));
  if (!project) throw new Error(`Project ${projectId} not found`);
  const presentationMode = project.presentationMode;

  const { value } = await runAgent({
    db,
    projectId,
    agentName: "PRODUCTION_DIRECTOR",
    preferredProvider,
    userPrompt: `Convert the approved script for "${topic}" into scene-by-scene production instructions for a ${presentationMode} project.`,
    inputSummary: `scriptId=${scriptId} presentationMode=${presentationMode}`,
    build: (rawText, providerId) =>
      providerId === "MOCK" ? { scenes: mockProductionScenes(topic, presentationMode) } : (parseJsonLoose(rawText) as { scenes: ProductionScene[] }),
    validate: (value) => {
      for (const s of value.scenes) {
        const result = safeValidate(ProductionSceneSchema, s);
        if (!result.success) return { success: false, error: result.error };
      }
      // FACELESS projects must never require on-camera footage.
      if (presentationMode === "FACELESS" && value.scenes.some((s) => s.segmentType === "ON_CAMERA")) {
        return { success: false, error: "A FACELESS project must not include ON_CAMERA scenes." };
      }
      return { success: true };
    },
    outputSummaryOf: (value) => `${value.scenes.length} production scenes generated (${value.scenes.filter((s) => s.segmentType === "ON_CAMERA").length} on-camera)`,
  });

  const rows = value.scenes.map((s) => ({
    id: randomUUID(),
    projectId,
    scriptId,
    sceneNumber: s.sceneNumber,
    segmentType: s.segmentType,
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
    screenInsertInterrupts: s.screenInsertInterrupts,
    punchIn: s.punchIn,
    pictureInPictureLayout: s.pictureInPictureLayout,
  }));

  const inserted = await db.insert(schema.productionScenes).values(rows).returning();

  // A-roll shot list: only for scenes the Production Director marked ON_CAMERA - never
  // fabricated for a FACELESS project, never skipped for FACE_LED/HYBRID scenes that need it.
  const onCameraScenes = inserted.filter((s) => s.segmentType === "ON_CAMERA");
  let arollCount = 0;
  if (onCameraScenes.length > 0) {
    const shots = mockArollShots(value.scenes.filter((s) => s.segmentType === "ON_CAMERA"));
    const arollRows = shots.map((shot) => {
      const matchedScene = onCameraScenes.find((s) => s.assetFilename === shot.filename);
      return {
        id: randomUUID(),
        projectId,
        productionSceneId: matchedScene?.id,
        shotNumber: shot.shotNumber,
        narration: shot.narration,
        shotType: shot.shotType,
        cameraPosition: shot.cameraPosition,
        framing: shot.framing,
        energy: shot.energy,
        durationMinSeconds: shot.durationMinSeconds,
        durationMaxSeconds: shot.durationMaxSeconds,
        delivery: shot.delivery,
        standingOrSeated: shot.standingOrSeated,
        backgroundSuggestion: shot.backgroundSuggestion,
        props: shot.props,
        screenInsertInterrupts: shot.screenInsertInterrupts,
        punchIn: shot.punchIn,
        captionsOnScreen: shot.captionsOnScreen,
        cameraGuidance: shot.cameraGuidance,
        filename: shot.filename,
      };
    });
    await db.insert(schema.arollShots).values(arollRows);
    arollCount = arollRows.length;
  }

  await logActivity(
    db,
    projectId,
    "AGENT",
    "PRODUCTION_PLAN_GENERATED",
    `${inserted.length} production scenes generated${arollCount > 0 ? ` (${arollCount} A-roll shot${arollCount === 1 ? "" : "s"} planned)` : ""}.`,
  );
  return inserted;
}
