import { eq, desc } from "drizzle-orm";
import { db, schema } from "@yaos/database";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";

export default async function ActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const activity = await db.select().from(schema.projectActivity).where(eq(schema.projectActivity.projectId, id)).orderBy(desc(schema.projectActivity.createdAt));
  const stageHistory = await db.select().from(schema.projectStageHistory).where(eq(schema.projectStageHistory.projectId, id)).orderBy(desc(schema.projectStageHistory.createdAt));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <section>
        <h2 className="text-sm font-semibold text-text-dim uppercase tracking-wide mb-3">Activity Log</h2>
        <div className="panel divide-y divide-border-subtle">
          {activity.map((a) => (
            <div key={a.id} className="p-3.5">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={a.actorType === "USER" ? "cyan" : a.actorType === "AGENT" ? "purple" : "default"}>{a.actorType}</Badge>
                <span className="text-xs text-text-faint">{formatRelativeTime(a.createdAt)}</span>
              </div>
              <p className="text-sm text-text-dim">{a.summary}</p>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2 className="text-sm font-semibold text-text-dim uppercase tracking-wide mb-3">Stage History</h2>
        <div className="panel divide-y divide-border-subtle">
          {stageHistory.map((h) => (
            <div key={h.id} className="p-3.5">
              <p className="text-sm">
                {h.fromStage ?? "—"} → <span className="text-accent-cyan">{h.toStage}</span>
              </p>
              <p className="text-xs text-text-faint">
                {h.actorType} {h.actorLabel ? `(${h.actorLabel})` : ""} • {formatRelativeTime(h.createdAt)}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
