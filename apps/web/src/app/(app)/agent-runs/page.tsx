import { eq, desc, inArray } from "drizzle-orm";
import { db, schema } from "@yaos/database";
import { getCurrentUser } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";

export default async function AgentRunsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const projects = await db.select().from(schema.projects).where(eq(schema.projects.workspaceId, user.workspaceId));
  const projectIds = projects.map((p) => p.id);
  const runs =
    projectIds.length === 0
      ? []
      : await db.select().from(schema.agentRuns).where(inArray(schema.agentRuns.projectId, projectIds)).orderBy(desc(schema.agentRuns.createdAt));

  const projectById = new Map(projects.map((p) => [p.id, p]));

  return (
    <div className="p-6 space-y-4 max-w-[1400px]">
      <div>
        <h1 className="text-xl font-semibold mb-1">Agent Runs</h1>
        <p className="text-sm text-text-dim">Every specialized agent execution across all projects.</p>
      </div>

      <div className="panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-text-dim border-b border-border-subtle">
              <th className="p-3 font-medium">Agent</th>
              <th className="p-3 font-medium">Project</th>
              <th className="p-3 font-medium">Provider</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Output</th>
              <th className="p-3 font-medium">Retries</th>
              <th className="p-3 font-medium">Started</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {runs.map((run) => (
              <tr key={run.id}>
                <td className="p-3">{run.agentName.replace(/_/g, " ")}</td>
                <td className="p-3 text-text-dim">{projectById.get(run.projectId)?.title ?? "—"}</td>
                <td className="p-3 text-text-dim">{run.providerUsed}</td>
                <td className="p-3">
                  <Badge variant={run.status === "COMPLETED" ? "success" : run.status === "FAILED" ? "danger" : "cyan"}>{run.status}</Badge>
                </td>
                <td className="p-3 text-text-dim max-w-xs truncate">{run.outputSummary ?? run.errorDetails ?? "—"}</td>
                <td className="p-3 text-text-dim">{run.retries}</td>
                <td className="p-3 text-text-faint">{formatRelativeTime(run.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {runs.length === 0 ? <p className="p-6 text-center text-text-dim text-sm">No agent runs yet.</p> : null}
      </div>
    </div>
  );
}
