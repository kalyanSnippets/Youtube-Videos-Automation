import { eq, desc } from "drizzle-orm";
import { db, schema } from "@yaos/database";
import { NotConnectedPanel } from "@/components/project/not-connected-panel";
import { Badge } from "@/components/ui/badge";

export default async function RenderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jobs = await db.select().from(schema.renderJobs).where(eq(schema.renderJobs.projectId, id)).orderBy(desc(schema.renderJobs.createdAt));

  if (jobs.length === 0) {
    return (
      <NotConnectedPanel
        title="No render jobs yet"
        description="Rendering runs on the local worker via Remotion + FFmpeg. Install and connect the local worker in Settings → Integrations, then render from the Edit Plan tab."
      />
    );
  }

  return (
    <div className="space-y-3">
      {jobs.map((job) => (
        <div key={job.id} className="panel p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{job.renderType} render</p>
            <p className="text-xs text-text-faint">{job.resolution}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-dim">{job.progressPercent}%</span>
            <Badge variant={job.status === "COMPLETED" ? "success" : job.status === "FAILED" ? "danger" : "cyan"}>{job.status}</Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
