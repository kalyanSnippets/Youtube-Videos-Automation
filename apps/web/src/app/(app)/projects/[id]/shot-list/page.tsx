import { eq } from "drizzle-orm";
import { db, schema } from "@yaos/database";
import { runAssetPlannerAction } from "@/lib/actions/production";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function ShotListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const items = await db.select().from(schema.shotListItems).where(eq(schema.shotListItems.projectId, id));
  const hasScenes = (await db.select().from(schema.productionScenes).where(eq(schema.productionScenes.projectId, id))).length > 0;

  async function run() {
    "use server";
    await runAssetPlannerAction(id);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Shot List</h2>
          <p className="text-sm text-text-dim">Exact capture/generation instructions per required asset.</p>
        </div>
        <form action={run}>
          <Button type="submit" disabled={!hasScenes}>
            Generate Shot List
          </Button>
        </form>
      </div>

      {items.length === 0 ? (
        <div className="panel p-10 text-center text-text-dim text-sm">No shot list yet.</div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="panel p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm font-mono">{item.filename}</h3>
                <Badge variant={item.shotType === "SCREEN_RECORDING" ? "cyan" : "purple"}>{item.shotType.replace("_", " ")}</Badge>
              </div>
              {item.shotType === "SCREEN_RECORDING" ? (
                <div className="grid grid-cols-2 gap-2 text-xs text-text-dim">
                  <p>Software: {item.software}</p>
                  <p>Shortcut: {item.shortcut}</p>
                  <p className="col-span-2">Setup: {item.windowSetup}</p>
                  <p className="col-span-2">Sequence: {item.exactSequence}</p>
                  <p>Cursor: {item.cursorBehavior}</p>
                  <p>Duration: {item.durationSeconds}s</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-xs text-text-dim">
                  <p>Tool: {item.toolOrModel}</p>
                  <p>Aspect ratio: {item.aspectRatio}</p>
                  <p className="col-span-2">Prompt: {item.prompt}</p>
                  <p>Max attempts: {item.maxAttempts}</p>
                  <p className="col-span-2">Acceptance criteria: {item.acceptanceCriteria}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
