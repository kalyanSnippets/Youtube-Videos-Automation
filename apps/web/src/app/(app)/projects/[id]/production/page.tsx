import { eq, asc } from "drizzle-orm";
import { db, schema } from "@yaos/database";
import { runProductionDirectorAction } from "@/lib/actions/production";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function ProductionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scenes = await db.select().from(schema.productionScenes).where(eq(schema.productionScenes.projectId, id)).orderBy(asc(schema.productionScenes.sceneNumber));
  const allScripts = await db.select().from(schema.scripts).where(eq(schema.scripts.projectId, id));
  const approvedScript = allScripts.find((s) => s.status === "APPROVED");

  async function run() {
    "use server";
    await runProductionDirectorAction(id);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Production Script</h2>
          <p className="text-sm text-text-dim">Scene-by-scene instructions detailed enough to execute without extra context.</p>
        </div>
        <form action={run}>
          <Button type="submit" disabled={!approvedScript}>
            Generate Production Plan
          </Button>
        </form>
      </div>

      {scenes.length === 0 ? (
        <div className="panel p-10 text-center text-text-dim text-sm">No production scenes generated yet.</div>
      ) : (
        <div className="space-y-4">
          {scenes.map((scene) => (
            <div key={scene.id} className="panel p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">Scene {scene.sceneNumber}</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="purple">{scene.motionComponent}</Badge>
                  <Badge variant={scene.motionIntensity === "HIGH" ? "danger" : scene.motionIntensity === "MEDIUM" ? "warning" : "default"}>
                    {scene.motionIntensity}
                  </Badge>
                  <Badge variant="default">{scene.timeEstimateSeconds}s</Badge>
                </div>
              </div>
              <p className="text-sm text-text-dim italic">&ldquo;{scene.narration}&rdquo;</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <Field label="Story purpose" value={scene.storyPurpose} />
                <Field label="Viewer must see" value={scene.viewerMustSee} />
                <Field label="Why this visual" value={scene.whyThisVisual} />
                <Field label="Asset" value={`${scene.assetType} — ${scene.assetFilename}`} />
                <Field label="Tool" value={scene.toolToUse} />
                <Field label="Capture/generation steps" value={scene.captureOrGenerationSteps} />
                {scene.exactGenerationPrompt ? <Field label="Generation prompt" value={scene.exactGenerationPrompt} /> : null}
                {scene.screenRecordingInstructions ? <Field label="Recording instructions" value={scene.screenRecordingInstructions} /> : null}
                {scene.privacyWarnings ? <Field label="Privacy warnings" value={scene.privacyWarnings} /> : null}
                <Field label="On-screen text" value={scene.onScreenText} />
                <Field label="Transition / SFX" value={`${scene.transition ?? "—"} / ${scene.sfx ?? "—"}`} />
                <Field label="Fallback if missing" value={scene.fallbackIfAssetMissing} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs text-text-dim mb-0.5">{label}</p>
      <p className="text-text-dim">{value ?? "—"}</p>
    </div>
  );
}
