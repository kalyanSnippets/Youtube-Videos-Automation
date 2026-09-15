import { eq } from "drizzle-orm";
import Link from "next/link";
import { db, schema } from "@yaos/database";
import { markAssetReadyAction, uploadNarrationAction } from "@/lib/actions/assets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STATUS_VARIANTS: Record<string, "success" | "danger" | "warning" | "default" | "cyan"> = {
  READY: "success",
  MISSING: "danger",
  NEEDS_RECAPTURE: "warning",
  GENERATING: "cyan",
  PROCESSING: "cyan",
  INVALID: "danger",
};

export default async function AssetsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const assets = await db.select().from(schema.assets).where(eq(schema.assets.projectId, id));
  const missing = assets.filter((a) => a.status === "MISSING" || a.status === "NEEDS_RECAPTURE");
  const hasNarration = assets.some((a) => a.category === "narration" && a.status === "READY");
  const arollShots = await db.select().from(schema.arollShots).where(eq(schema.arollShots.projectId, id));
  const missingAroll = arollShots.filter((s) => s.status === "MISSING" || s.status === "NEEDS_RECAPTURE").length;

  async function uploadNarration() {
    "use server";
    await uploadNarrationAction(id);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Assets</h2>
          <p className="text-sm text-text-dim">
            {assets.length} tracked • {missing.length} missing • {assets.filter((a) => a.status === "READY").length} ready
          </p>
        </div>
        {!hasNarration ? (
          <form action={uploadNarration}>
            <Button type="submit" variant="secondary">
              Upload Narration (demo)
            </Button>
          </form>
        ) : null}
      </div>

      {arollShots.length > 0 ? (
        <Link href={`/projects/${id}/aroll`} className="block panel p-3.5 text-sm hover:border-accent-cyan/40 transition">
          {missingAroll > 0 ? (
            <span>
              <Badge variant="warning">{missingAroll} A-roll shot{missingAroll === 1 ? "" : "s"} still to film</Badge>{" "}
              <span className="text-text-dim">— see the A-Roll tab</span>
            </span>
          ) : (
            <span className="text-text-dim">
              <Badge variant="success">All A-roll shots filmed</Badge> — see the A-Roll tab
            </span>
          )}
        </Link>
      ) : null}

      {assets.length === 0 ? (
        <div className="panel p-10 text-center text-text-dim text-sm">No assets tracked yet - generate a production plan and shot list first.</div>
      ) : (
        <div className="panel divide-y divide-border-subtle">
          {assets.map((asset) => (
            <AssetRow key={asset.id} asset={asset} projectId={id} />
          ))}
        </div>
      )}
    </div>
  );
}

function AssetRow({ asset, projectId }: { asset: typeof schema.assets.$inferSelect; projectId: string }) {
  async function markReady() {
    "use server";
    await markAssetReadyAction(asset.id, projectId);
  }

  return (
    <div className="p-4 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-mono truncate">{asset.filename}</p>
        <p className="text-xs text-text-faint capitalize">
          {asset.category.replace("_", " ")} • {asset.sourceType.replace(/_/g, " ")}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Badge variant={STATUS_VARIANTS[asset.status] ?? "default"}>{asset.status.replace("_", " ")}</Badge>
        {asset.status !== "READY" ? (
          <form action={markReady}>
            <Button type="submit" variant="secondary" className="text-xs px-2 py-1">
              Mark ready
            </Button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
