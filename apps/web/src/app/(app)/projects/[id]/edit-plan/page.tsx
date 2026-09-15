import { eq, asc } from "drizzle-orm";
import { db, schema } from "@yaos/database";
import { NotConnectedPanel } from "@/components/project/not-connected-panel";
import { Badge } from "@/components/ui/badge";

export default async function EditPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scenes = await db.select().from(schema.editPlanScenes).where(eq(schema.editPlanScenes.projectId, id)).orderBy(asc(schema.editPlanScenes.sceneOrder));

  if (scenes.length === 0) {
    return (
      <NotConnectedPanel
        title="No edit plan yet"
        description="The Edit Director builds this from the approved script, word-level transcript, production scenes, and resolved assets. Requires a transcript first."
      />
    );
  }

  return (
    <div className="space-y-3">
      {scenes.map((scene) => (
        <div key={scene.id} className="panel p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">
              Scene {scene.sceneOrder} — {scene.component}
            </p>
            <p className="text-xs text-text-faint">
              {(scene.startMs / 1000).toFixed(1)}s – {(scene.endMs / 1000).toFixed(1)}s
            </p>
          </div>
          <Badge variant={scene.intensity === "HIGH" ? "danger" : scene.intensity === "MEDIUM" ? "warning" : "default"}>{scene.intensity}</Badge>
        </div>
      ))}
    </div>
  );
}
