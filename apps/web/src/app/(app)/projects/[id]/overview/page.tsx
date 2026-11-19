import { eq, desc } from "drizzle-orm";
import { db, schema } from "@yaos/database";
import { getProjectDetail } from "@/lib/project-detail";
import { PRESENTATION_MODES, PRESENTATION_MODE_DESCRIPTIONS, PRESENTATION_MODE_LABELS, STAGE_LABELS, STAGES } from "@yaos/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { setPresentationModeAction } from "@/lib/actions/presentation-mode";

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
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 text-sm">
            <dt className="text-text-dim">Content type</dt>
            <dd className="capitalize">{project.contentType.replace("_", " ")}</dd>
            <dt className="text-text-dim">Seed idea</dt>
            <dd>{project.seedIdea ?? "—"}</dd>
            <dt className="text-text-dim">Target duration</dt>
            <dd>{project.targetDurationMinutes} minutes</dd>
            <dt className="text-text-dim">Language</dt>
            <dd className="uppercase">{project.language}</dd>
            <dt className="text-text-dim">Evergreen / Trend</dt>
            <dd className="capitalize">{project.evergreenOrTrend}</dd>
            <dt className="text-text-dim">Created</dt>
            <dd>{formatRelativeTime(project.createdAt)}</dd>
          </dl>
        </div>

        <div className="panel p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-text-dim uppercase tracking-wide">Presentation Mode</h2>
            {project.presentationModeIsRecommended ? <Badge variant="purple">Recommended</Badge> : <Badge variant="cyan">Set by you</Badge>}
          </div>
          <p className="text-sm font-medium mb-1">{PRESENTATION_MODE_LABELS[project.presentationMode]}</p>
          <p className="text-xs text-text-dim mb-4">{PRESENTATION_MODE_DESCRIPTIONS[project.presentationMode]}</p>
          <form action={setPresentationModeAction} className="flex items-center gap-2">
            <input type="hidden" name="projectId" value={project.id} />
            <select
              name="presentationMode"
              defaultValue={project.presentationMode}
              className="flex-1 rounded-lg bg-bg-raised border border-border px-3 py-2 text-xs outline-none focus:border-accent-cyan/50"
            >
              {PRESENTATION_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {PRESENTATION_MODE_LABELS[mode]}
                </option>
              ))}
            </select>
            <Button type="submit" variant="secondary" className="text-xs px-3 py-2">
              Change
            </Button>
          </form>
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
