import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { getProjectSummaries } from "@/lib/project-data";
import { ProjectCard } from "@/components/dashboard/project-card";
import { Badge } from "@/components/ui/badge";
import { db, schema } from "@yaos/database";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const projects = await getProjectSummaries(user.workspaceId);
  const awaitingApproval = projects.filter((p) => p.requiresApproval);
  const missingAssets = projects.filter((p) => p.missingAssetCount > 0);
  const trustWarnings = projects.filter((p) => p.trustCoveragePercent < 100);

  const recentRuns = await db
    .select()
    .from(schema.agentRuns)
    .orderBy(desc(schema.agentRuns.createdAt))
    .limit(6);

  const renderJobs = await db
    .select()
    .from(schema.renderJobs)
    .orderBy(desc(schema.renderJobs.createdAt))
    .limit(5);

  return (
    <div className="p-4 sm:p-6 space-y-8 max-w-[1400px]">
      <div>
        <h1 className="text-xl font-semibold mb-1">Dashboard</h1>
        <p className="text-sm text-text-dim">{projects.length} active project{projects.length === 1 ? "" : "s"} in your workspace.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <SummaryStat label="Active Projects" value={projects.length} />
        <SummaryStat label="Awaiting Approval" value={awaitingApproval.length} variant="warning" />
        <SummaryStat label="Missing Assets" value={missingAssets.reduce((s, p) => s + p.missingAssetCount, 0)} variant="danger" />
        <SummaryStat label="Trust Warnings" value={trustWarnings.length} variant="warning" />
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-text-dim uppercase tracking-wide">Projects</h2>
          <Link href="/projects" className="text-xs text-accent-cyan hover:underline">
            View all
          </Link>
        </div>
        {projects.length === 0 ? (
          <div className="panel p-10 text-center text-text-dim text-sm">
            No projects yet. Click <span className="text-accent-cyan">Start New Video</span> to begin.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <h2 className="text-sm font-semibold text-text-dim uppercase tracking-wide mb-3">Recent Agent Runs</h2>
          <div className="panel divide-y divide-border-subtle">
            {recentRuns.length === 0 ? (
              <p className="p-4 text-sm text-text-dim">No agent runs yet.</p>
            ) : (
              recentRuns.map((run) => (
                <div key={run.id} className="p-3.5 flex items-center justify-between text-sm">
                  <div>
                    <p>{run.agentName.replace(/_/g, " ")}</p>
                    <p className="text-xs text-text-faint">{run.providerUsed} • {formatRelativeTime(run.createdAt)}</p>
                  </div>
                  <Badge variant={run.status === "COMPLETED" ? "success" : run.status === "FAILED" ? "danger" : "cyan"}>
                    {run.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-text-dim uppercase tracking-wide mb-3">Render Jobs</h2>
          <div className="panel divide-y divide-border-subtle">
            {renderJobs.length === 0 ? (
              <p className="p-4 text-sm text-text-dim">No render jobs yet - connect a local worker to render.</p>
            ) : (
              renderJobs.map((job) => (
                <div key={job.id} className="p-3.5 flex items-center justify-between text-sm">
                  <div>
                    <p>{job.renderType} render</p>
                    <p className="text-xs text-text-faint">{formatRelativeTime(job.createdAt)}</p>
                  </div>
                  <Badge variant={job.status === "COMPLETED" ? "success" : job.status === "FAILED" ? "danger" : "cyan"}>
                    {job.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function SummaryStat({ label, value, variant }: { label: string; value: number; variant?: "warning" | "danger" }) {
  const color = variant === "danger" ? "text-status-danger" : variant === "warning" ? "text-status-warning" : "text-text";
  return (
    <div className="panel p-4">
      <p className="text-xs text-text-dim mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}
