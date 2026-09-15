import { eq, desc } from "drizzle-orm";
import { db, schema } from "@yaos/database";
import { NotConnectedPanel } from "@/components/project/not-connected-panel";

export default async function AnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [snapshot] = await db
    .select()
    .from(schema.analyticsSnapshots)
    .where(eq(schema.analyticsSnapshots.projectId, id))
    .orderBy(desc(schema.analyticsSnapshots.capturedAt))
    .limit(1);

  if (!snapshot) {
    return (
      <NotConnectedPanel
        title="No analytics yet"
        description="Connect the YouTube Analytics API in Settings → Integrations once this video is published to pull impressions, CTR, and retention."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Stat label="Impressions" value={snapshot.impressions} />
      <Stat label="CTR" value={snapshot.ctrPercent ? `${snapshot.ctrPercent}%` : null} />
      <Stat label="First 30s retention" value={snapshot.retentionFirst30sPercent ? `${snapshot.retentionFirst30sPercent}%` : null} />
      <Stat label="Avg % viewed" value={snapshot.averagePercentageViewed ? `${snapshot.averagePercentageViewed}%` : null} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="panel p-4">
      <p className="text-xs text-text-dim mb-1">{label}</p>
      <p className="text-lg font-semibold">{value ?? "—"}</p>
    </div>
  );
}
