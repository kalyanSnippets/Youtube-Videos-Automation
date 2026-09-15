import { eq } from "drizzle-orm";
import { db, schema } from "@yaos/database";
import { NotConnectedPanel } from "@/components/project/not-connected-panel";
import { Badge } from "@/components/ui/badge";

const SEVERITY_VARIANT: Record<string, "danger" | "warning" | "default"> = {
  CRITICAL: "danger",
  HIGH: "danger",
  MEDIUM: "warning",
  LOW: "default",
};

export default async function QAPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const issues = await db.select().from(schema.qaIssues).where(eq(schema.qaIssues.projectId, id));

  if (issues.length === 0) {
    return (
      <NotConnectedPanel
        title="No QA issues yet"
        description="The Video Critic reviews a rough render once one exists. Connect the local worker to produce a rough render first."
      />
    );
  }

  return (
    <div className="space-y-3">
      {issues.map((issue) => (
        <div key={issue.id} className="panel p-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{issue.problem}</p>
            <Badge variant={SEVERITY_VARIANT[issue.severity]}>{issue.severity}</Badge>
          </div>
          <p className="text-xs text-text-dim">{issue.whyItHurts}</p>
          <p className="text-xs text-accent-cyan">Fix: {issue.fix}</p>
        </div>
      ))}
    </div>
  );
}
