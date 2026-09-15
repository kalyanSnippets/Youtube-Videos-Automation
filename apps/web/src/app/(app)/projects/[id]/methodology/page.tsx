import { eq } from "drizzle-orm";
import { db, schema } from "@yaos/database";
import { runExperimentDesignerAction } from "@/lib/actions/methodology";
import { Button } from "@/components/ui/button";

export default async function MethodologyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, id));
  const [methodology] = await db.select().from(schema.methodologies).where(eq(schema.methodologies.projectId, id));

  const required = project.contentType === "experiment" || project.contentType === "comparison" || project.contentType === "case_study";

  if (!required) {
    return (
      <div className="panel p-10 text-center text-text-dim text-sm">
        Methodology is not required for a &ldquo;{project.contentType.replace("_", " ")}&rdquo; video - this stage is skipped automatically.
      </div>
    );
  }

  async function run() {
    "use server";
    await runExperimentDesignerAction(id);
  }

  if (!methodology) {
    return (
      <div className="panel p-10 text-center space-y-4">
        <p className="text-text-dim text-sm">No methodology defined yet. It must be locked before any test results are entered.</p>
        <form action={run}>
          <Button type="submit">Define Methodology</Button>
        </form>
      </div>
    );
  }

  return (
    <div className="panel p-5 space-y-4">
      <h2 className="text-base font-semibold mb-1">Locked Methodology</h2>
      <p className="text-xs text-text-faint mb-3">Defined before any results were entered - this cannot be edited after results exist without invalidating the test.</p>
      <Row label="Same prompt/input" value={methodology.samePromptOrInput} />
      <Row label="Number of attempts" value={String(methodology.numberOfAttempts)} />
      <Row label="Account tier" value={methodology.accountTier} />
      <Row label="Location/region" value={methodology.locationRegion} />
      <Row label="Duration notes" value={methodology.durationNotes} />
      <Row label="Resolution notes" value={methodology.resolutionNotes} />
      <Row label="Inclusion rules" value={methodology.inclusionRules} />
      <Row label="Exclusion rules" value={methodology.exclusionRules} />
      <Row label="Tier definitions" value={methodology.tierDefinitions} />
      <div>
        <p className="text-xs text-text-dim mb-1.5">Scoring metrics</p>
        <div className="flex flex-wrap gap-2">
          {(methodology.scoringMetrics ?? []).map((m) => (
            <span key={m.metric} className="badge bg-bg-raised border border-border">
              {m.metric} — {m.weight}%
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs text-text-dim mb-0.5">{label}</p>
      <p className="text-sm text-text-dim">{value ?? "—"}</p>
    </div>
  );
}
