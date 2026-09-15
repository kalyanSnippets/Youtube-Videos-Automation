import { eq, asc } from "drizzle-orm";
import { db, schema } from "@yaos/database";
import { markArollShotReadyAction } from "@/lib/actions/aroll";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STATUS_VARIANTS: Record<string, "success" | "danger" | "warning" | "default" | "cyan"> = {
  READY: "success",
  MISSING: "danger",
  NEEDS_RECAPTURE: "warning",
  GENERATING: "cyan",
  PROCESSING: "cyan",
  INVALID: "danger",
};

export default async function ArollPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, id));

  if (project.presentationMode === "FACELESS") {
    return (
      <div className="panel p-10 text-center text-text-dim text-sm">
        This is a faceless project - no on-camera footage is required. Switch to Face-led or Hybrid from the Overview
        tab if you want to add a talking-head segment.
      </div>
    );
  }

  const shots = await db.select().from(schema.arollShots).where(eq(schema.arollShots.projectId, id)).orderBy(asc(schema.arollShots.shotNumber));

  if (shots.length === 0) {
    return (
      <div className="panel p-10 text-center text-text-dim text-sm">
        No A-roll shots planned yet. The Production Director generates this shot list alongside the production script
        for {project.presentationMode === "FACE_LED" ? "face-led" : "hybrid"} projects.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">A-Roll Shot List</h2>
        <p className="text-sm text-text-dim">
          On-camera footage instructions - {shots.filter((s) => s.status === "READY").length} of {shots.length} filmed.
        </p>
      </div>

      <div className="space-y-4">
        {shots.map((shot) => (
          <ArollShotCard key={shot.id} shot={shot} projectId={id} />
        ))}
      </div>
    </div>
  );
}

function ArollShotCard({ shot, projectId }: { shot: typeof schema.arollShots.$inferSelect; projectId: string }) {
  async function markReady() {
    "use server";
    await markArollShotReadyAction(shot.id, projectId);
  }

  return (
    <div className="panel p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">A-ROLL {String(shot.shotNumber).padStart(3, "0")}</h3>
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_VARIANTS[shot.status] ?? "default"}>{shot.status.replace("_", " ")}</Badge>
          {shot.status !== "READY" ? (
            <form action={markReady}>
              <Button type="submit" variant="secondary" className="text-xs px-2 py-1">
                Mark filmed
              </Button>
            </form>
          ) : null}
        </div>
      </div>
      <p className="text-sm text-text-dim italic">&ldquo;{shot.narration}&rdquo;</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-sm">
        <Field label="Shot" value={shot.shotType} />
        <Field label="Camera" value={shot.cameraPosition} />
        <Field label="Framing" value={shot.framing} />
        <Field label="Energy" value={shot.energy} />
        <Field label="Duration" value={shot.durationMinSeconds && shot.durationMaxSeconds ? `${shot.durationMinSeconds}-${shot.durationMaxSeconds} sec` : null} />
        <Field label="Delivery" value={shot.delivery} />
        <Field label="Standing / seated" value={shot.standingOrSeated} />
        <Field label="Background" value={shot.backgroundSuggestion} />
        {shot.props ? <Field label="Props" value={shot.props} /> : null}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {shot.screenInsertInterrupts ? <Badge variant="warning">Screen insert will interrupt this shot</Badge> : null}
        {shot.punchIn ? <Badge variant="purple">Punch in during edit</Badge> : null}
        {shot.captionsOnScreen ? <Badge variant="default">Captions on screen</Badge> : null}
      </div>
      {shot.cameraGuidance ? (
        <p className="text-xs text-text-faint pt-2 border-t border-border-subtle">Camera guidance: {shot.cameraGuidance}</p>
      ) : null}
      <p className="text-xs text-text-faint font-mono">Save as: {shot.filename}</p>
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
