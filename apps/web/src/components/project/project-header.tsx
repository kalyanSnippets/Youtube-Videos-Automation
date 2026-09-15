import { AlertTriangle, ShieldCheck } from "lucide-react";
import type { ProjectDetail } from "@/lib/project-detail";
import { StageChip } from "@/components/ui/stage-chip";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress";

export function ProjectHeader({ detail }: { detail: ProjectDetail }) {
  const { project, progress, nextAction, trustCoveragePercent, assetsReadyPercent } = detail;
  return (
    <div className="px-6 py-5 border-b border-border">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-lg font-semibold">{project.title}</h1>
            {project.isDemo ? <Badge variant="purple">DEMO</Badge> : null}
          </div>
          <p className="text-xs text-text-faint font-mono">{project.id}</p>
        </div>
        <StageChip stage={project.currentStage} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <Metric label="Completion">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{progress}%</span>
          </div>
          <ProgressBar value={progress} className="mt-1.5" />
        </Metric>
        <Metric label="Trust coverage">
          <span className={`text-sm font-medium flex items-center gap-1 ${trustCoveragePercent === 100 ? "text-status-success" : "text-status-warning"}`}>
            <ShieldCheck size={13} /> {trustCoveragePercent}%
          </span>
        </Metric>
        <Metric label="Assets ready">
          <span className="text-sm font-medium">{assetsReadyPercent}%</span>
        </Metric>
        <Metric label="Status">
          {nextAction.blocking ? (
            <Badge variant="warning">
              <AlertTriangle size={11} /> Blocked on you
            </Badge>
          ) : (
            <Badge variant="success">Unblocked</Badge>
          )}
        </Metric>
      </div>

      <div className="panel-raised px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-text-dim mb-0.5">Next action</p>
          <p className="text-sm font-medium">{nextAction.label}</p>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-text-dim mb-1">{label}</p>
      {children}
    </div>
  );
}
