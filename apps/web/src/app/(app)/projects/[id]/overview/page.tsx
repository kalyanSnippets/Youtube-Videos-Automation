import { eq, desc } from "drizzle-orm";
import { db, schema } from "@yaos/database";
import { getProjectDetail } from "@/lib/project-detail";
import { STAGE_LABELS, STAGES } from "@yaos/shared";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

export default async function OverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getProjectDetail(id);
  const { project, requiredStages } = detail;

  const activity = await db
    .select()
    .from(schema.projectActivity)
    .where(eq(schema.projectActivity.projectId, id))
    .orderBy(desc(schema.projectActivity.createdAt))
    .limit(8);

  const currentIndex = STAGES.indexOf(project.currentStage);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="panel p-5">
          <h2 className="text-sm font-semibold text-text-dim uppercase tracking-wide mb-3">Project Details</h2>
          <dl className="grid grid-cols-2 gap-y-3 text-sm">
            <dt className="text-text-dim">Content type</dt>
            <dd className="capitalize">{project.contentType.replace("_", " ")}</dd>
            <dt className="text-text-dim">Seed idea</dt>
            <dd>{project.seedIdea ?? "—"}</dd>
            <dt className="text-text-dim">Target duration</dt>
            <dd>{project.targetDurationMinutes} minutes</dd>
            <dt className="text-text-dim">Language</dt>
            <dd className="uppercase">{project.language}</dd>
            <dt className="text-text-dim">Face mode</dt>
            <dd className="capitalize">{project.faceMode}</dd>
            <dt className="text-text-dim">Evergreen / Trend</dt>
            <dd className="capitalize">{project.evergreenOrTrend}</dd>
            <dt className="text-text-dim">Created</dt>
            <dd>{formatRelativeTime(project.createdAt)}</dd>
          </dl>
        </div>

        <div className="panel p-5">
          <h2 className="text-sm font-semibold text-text-dim uppercase tracking-wide mb-3">Required Stages</h2>
          <ol className="space-y-2">
            {requiredStages.map((stage) => {
              const stageIndex = STAGES.indexOf(stage);
              const done = stageIndex < currentIndex;
              const isCurrent = stage === project.currentStage;
              return (
                <li key={stage} className="flex items-center gap-2.5 text-sm">
                  <span
                    className={`h-5 w-5 rounded-full flex items-center justify-center border ${
                      done ? "bg-accent-cyan border-accent-cyan text-bg" : isCurrent ? "border-accent-cyan text-accent-cyan" : "border-border text-text-faint"
                    }`}
                  >
                    {done ? <Check size={12} /> : ""}
                  </span>
                  <span className={isCurrent ? "text-text font-medium" : done ? "text-text-dim" : "text-text-faint"}>
                    {STAGE_LABELS[stage]}
                  </span>
                  {isCurrent ? <Badge variant="cyan">Current</Badge> : null}
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <div className="panel p-5">
        <h2 className="text-sm font-semibold text-text-dim uppercase tracking-wide mb-3">Recent Activity</h2>
        {activity.length === 0 ? (
          <p className="text-sm text-text-dim">No activity yet.</p>
        ) : (
          <ul className="space-y-3">
            {activity.map((a) => (
              <li key={a.id} className="text-sm">
                <div className="flex items-center gap-2 mb-0.5">
                  <Badge variant={a.actorType === "USER" ? "cyan" : a.actorType === "AGENT" ? "purple" : "default"}>{a.actorType}</Badge>
                  <span className="text-xs text-text-faint">{formatRelativeTime(a.createdAt)}</span>
                </div>
                <p className="text-text-dim">{a.summary}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
