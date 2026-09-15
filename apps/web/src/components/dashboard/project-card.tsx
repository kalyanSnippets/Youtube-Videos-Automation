import Link from "next/link";
import { AlertTriangle, Clock, ShieldCheck } from "lucide-react";
import type { ProjectSummary } from "@/lib/project-data";
import { StageChip, PresentationModeBadge } from "@/components/ui/stage-chip";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress";
import { formatRelativeTime } from "@/lib/utils";

export function ProjectCard({ project }: { project: ProjectSummary }) {
  return (
    <Link href={`/projects/${project.id}`} className="panel p-5 flex flex-col gap-3 hover:border-accent-cyan/40 transition group">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-sm group-hover:text-accent-cyan transition">{project.title}</h3>
            {project.isDemo ? <Badge variant="purple">DEMO</Badge> : null}
          </div>
          <p className="text-xs text-text-faint font-mono">{project.id.slice(0, 8)}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <StageChip stage={project.currentStage} />
          <PresentationModeBadge mode={project.presentationMode} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs text-text-dim mb-1.5">
          <span>{project.progress}% complete</span>
          <span className="capitalize">{project.contentType.replace("_", " ")}</span>
        </div>
        <ProgressBar value={project.progress} />
      </div>

      <div className="flex items-center gap-2 text-xs">
        {project.isBlocked ? (
          <Badge variant="warning">
            <AlertTriangle size={11} /> Needs you
          </Badge>
        ) : (
          <Badge variant="success">Unblocked</Badge>
        )}
        {project.missingAssetCount > 0 ? <Badge variant="danger">{project.missingAssetCount} missing assets</Badge> : null}
        <Badge variant={project.trustCoveragePercent === 100 ? "success" : "warning"}>
          <ShieldCheck size={11} /> {project.trustCoveragePercent}% trust
        </Badge>
      </div>

      <div className="pt-2 border-t border-border-subtle">
        <p className="text-xs text-text-dim mb-1">Next action</p>
        <p className="text-sm">{project.nextActionLabel}</p>
      </div>

      <div className="flex items-center justify-between text-xs text-text-faint pt-1">
        <span className="truncate max-w-[60%]">{project.lastActivitySummary ?? "No activity yet"}</span>
        <span className="flex items-center gap-1 shrink-0">
          <Clock size={11} />
          {formatRelativeTime(project.updatedAt)}
        </span>
      </div>
    </Link>
  );
}
