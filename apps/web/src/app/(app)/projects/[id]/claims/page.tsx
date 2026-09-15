import { eq } from "drizzle-orm";
import { db, schema } from "@yaos/database";
import { calculateTrustCoverage, CLAIM_TYPES } from "@yaos/shared";
import { runClaimsResearchAction, verifyClaimAction } from "@/lib/actions/claims";
import { ClaimTypeBadge } from "@/components/ui/stage-chip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress";

export default async function ClaimsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const claims = await db.select().from(schema.claims).where(eq(schema.claims.projectId, id));
  const allSources = await db.select().from(schema.claimSources);
  const trustCoverage = calculateTrustCoverage(claims);
  const unverifiedCount = claims.filter((c) => c.claimType === "UNVERIFIED").length;

  async function run() {
    "use server";
    await runClaimsResearchAction(id);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Claims & Evidence Ledger</h2>
          <p className="text-sm text-text-dim">Every factual or evaluative statement must be classified and sourced before script approval.</p>
        </div>
        <form action={run}>
          <Button type="submit">Run Claims Research</Button>
        </form>
      </div>

      <div className="panel p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">Trust Coverage</p>
          <p className={`text-sm font-semibold ${trustCoverage === 100 ? "text-status-success" : "text-status-warning"}`}>{trustCoverage}%</p>
        </div>
        <ProgressBar value={trustCoverage} />
        <div className="flex gap-4 mt-3 text-xs text-text-dim">
          <span>{claims.length} total claims</span>
          <span>{claims.filter((c) => c.claimType !== "UNVERIFIED").length} verified/typed</span>
          <span className={unverifiedCount > 0 ? "text-status-danger" : ""}>{unverifiedCount} unverified</span>
        </div>
      </div>

      {claims.length === 0 ? (
        <div className="panel p-10 text-center text-text-dim text-sm">No claims extracted yet.</div>
      ) : (
        <div className="space-y-3">
          {claims.map((claim) => (
            <ClaimRow key={claim.id} claim={claim} sources={allSources.filter((s) => s.claimId === claim.id)} projectId={id} />
          ))}
        </div>
      )}
    </div>
  );
}

function ClaimRow({
  claim,
  sources,
  projectId,
}: {
  claim: typeof schema.claims.$inferSelect;
  sources: (typeof schema.claimSources.$inferSelect)[];
  projectId: string;
}) {
  async function reclassify(formData: FormData) {
    "use server";
    const newType = String(formData.get("claimType")) as (typeof CLAIM_TYPES)[number];
    await verifyClaimAction(claim.id, newType, projectId);
  }

  return (
    <div className={`panel p-4 space-y-2.5 ${claim.claimType === "UNVERIFIED" ? "border-status-danger/40" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm flex-1">{claim.claimText}</p>
        <ClaimTypeBadge claimType={claim.claimType} />
      </div>
      {claim.safeWording ? (
        <p className="text-xs text-text-dim">
          <span className="text-text-faint">Safe wording: </span>
          {claim.safeWording}
        </p>
      ) : null}
      {claim.forbiddenWording ? (
        <p className="text-xs text-status-danger">
          <span className="text-text-faint">Never say: </span>
          {claim.forbiddenWording}
        </p>
      ) : null}
      {sources.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {sources.map((s) => (
            <Badge key={s.id} variant={s.kind === "OFFICIAL" ? "cyan" : s.kind === "OUR_TEST" ? "purple" : "default"}>
              {s.kind}: {s.title}
            </Badge>
          ))}
        </div>
      ) : null}
      <form action={reclassify} className="flex items-center gap-2 pt-1">
        <select name="claimType" defaultValue={claim.claimType} className="rounded-lg bg-bg-raised border border-border px-2 py-1 text-xs">
          {CLAIM_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary" className="text-xs px-2 py-1">
          Update classification
        </Button>
      </form>
    </div>
  );
}
