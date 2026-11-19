import { eq } from "drizzle-orm";
import { db, schema } from "@yaos/database";
import { runCompetitorAnalysisAction, confirmReferencesAction } from "@/lib/actions/references";
import { getLatestAgentRun } from "@/lib/agent-status";
import { AgentPendingPanel } from "@/components/agent-pending-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PresentationModeBadge } from "@/components/ui/stage-chip";

// The analyse trigger fires the agent in the background via after() rather than blocking on it -
// this extends how long that background work may keep running.
export const maxDuration = 300;

export default async function ReferencesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const references = await db.select().from(schema.referenceVideos).where(eq(schema.referenceVideos.projectId, id));
  const latestRun = await getLatestAgentRun(id, "COMPETITOR_ANALYST");

  async function run() {
    "use server";
    await runCompetitorAnalysisAction(id);
  }
  async function confirm() {
    "use server";
    await confirmReferencesAction(id);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Reference Videos</h2>
          <p className="text-sm text-text-dim">
            Structure and technique only - never copied narration. See docs/AGENTS.md for the copyright rule this agent follows.
          </p>
        </div>
        <div className="flex gap-2">
          {references.length > 0 ? (
            <form action={confirm}>
              <Button type="submit" variant="secondary">
                Confirm analysis
              </Button>
            </form>
          ) : null}
          <form action={run}>
            <Button type="submit">Analyse Reference Videos</Button>
          </form>
        </div>
      </div>

      {references.length === 0 ? (
        <AgentPendingPanel run={latestRun} emptyLabel="No reference videos analysed yet." />
      ) : (
        <div className="space-y-4">
          {references.map((ref) => (
            <div key={ref.id} className="panel p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-sm">{ref.title}</h3>
                  <p className="text-xs text-text-faint">{ref.channelName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <PresentationModeBadge mode={ref.presentationMode} />
                  <Badge variant={ref.role === "MASTER_REFERENCE" ? "cyan" : "default"}>{ref.role.replace("_", " ")}</Badge>
                </div>
              </div>
              {ref.onCameraSegments && ref.onCameraSegments.length > 0 ? (
                <div>
                  <p className="text-xs text-text-dim mb-1.5">Where and why the face appears</p>
                  <div className="space-y-1">
                    {ref.onCameraSegments.map((seg, i) => (
                      <p key={i} className="text-xs text-text-dim">
                        <span className="font-mono text-text-faint">
                          {Math.floor(seg.startSeconds / 60)}:{String(seg.startSeconds % 60).padStart(2, "0")}–
                          {Math.floor(seg.endSeconds / 60)}:{String(seg.endSeconds % 60).padStart(2, "0")}
                        </span>{" "}
                        {seg.purpose}
                      </p>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <Field label="Title logic" value={ref.titleLogic} />
                <Field label="Thumbnail logic" value={ref.thumbnailLogic} />
                <Field label="Hook analysis" value={ref.hookAnalysis} />
                <Field label="First 30s" value={ref.first30sAnalysis} />
                <Field label="Pacing" value={ref.pacingNotes} />
                <Field label="Tension" value={ref.tensionNotes} />
                <Field label="Proof sequence" value={ref.proofSequenceNotes} />
                <Field label="Payoff" value={ref.payoffNotes} />
                <Field label="Why it worked" value={ref.whyItWorked} />
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
