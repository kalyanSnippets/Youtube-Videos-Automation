import { eq, desc } from "drizzle-orm";
import { db, schema } from "@yaos/database";
import { runStoryWriterAction } from "@/lib/actions/scripts";
import { approveScriptAction } from "@/lib/actions/scripts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function ScriptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scripts = await db.select().from(schema.scripts).where(eq(schema.scripts.projectId, id)).orderBy(desc(schema.scripts.version));
  const claims = await db.select().from(schema.claims).where(eq(schema.claims.projectId, id));
  const unverifiedCount = claims.filter((c) => c.claimType === "UNVERIFIED").length;
  const latest = scripts[0];

  async function draft() {
    "use server";
    await runStoryWriterAction(id);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Script</h2>
          <p className="text-sm text-text-dim">Narration-only draft. Approval is blocked while unverified claims remain, unless overridden.</p>
        </div>
        <form action={draft}>
          <Button type="submit" variant="secondary">
            {latest ? "Draft New Version" : "Draft Script"}
          </Button>
        </form>
      </div>

      {!latest ? (
        <div className="panel p-10 text-center text-text-dim text-sm">No script drafted yet.</div>
      ) : (
        <div className="panel p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm">Version {latest.version}</h3>
              <Badge variant={latest.status === "APPROVED" ? "success" : "cyan"}>{latest.status}</Badge>
            </div>
            <p className="text-xs text-text-faint">
              {latest.estimatedWordCount} words • ~{Math.round((latest.estimatedDurationSeconds ?? 0) / 60)} min
            </p>
          </div>

          <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap text-text-dim leading-relaxed">
            {latest.narrationMarkdown}
          </div>

          {latest.status === "DRAFT" ? (
            <div className="pt-4 border-t border-border-subtle space-y-3">
              {unverifiedCount > 0 ? (
                <div className="rounded-lg border border-status-danger/40 bg-status-danger/5 p-3 text-sm">
                  <p className="text-status-danger font-medium mb-1">{unverifiedCount} unverified claim(s) block approval</p>
                  <p className="text-text-dim text-xs">Resolve them in the Claims tab, or explicitly override below (visible warning recorded in Activity).</p>
                </div>
              ) : null}
              <form action={approveScriptAction} className="space-y-2">
                <input type="hidden" name="projectId" value={id} />
                <input type="hidden" name="scriptId" value={latest.id} />
                {unverifiedCount > 0 ? (
                  <>
                    <label className="flex items-center gap-2 text-xs text-text-dim">
                      <input type="checkbox" name="override" />
                      Override and approve anyway
                    </label>
                    <input
                      name="overrideReason"
                      placeholder="Reason for override (required, recorded in activity log)"
                      className="w-full rounded-lg bg-bg-raised border border-border px-3 py-2 text-xs outline-none focus:border-accent-cyan/50"
                    />
                  </>
                ) : null}
                <Button type="submit" className="w-full">
                  Approve Script
                </Button>
              </form>
            </div>
          ) : null}
        </div>
      )}

      {scripts.length > 1 ? (
        <div className="panel p-5">
          <h3 className="text-sm font-semibold text-text-dim uppercase tracking-wide mb-3">Version History</h3>
          <div className="space-y-2">
            {scripts.slice(1).map((s) => (
              <div key={s.id} className="flex items-center justify-between text-sm">
                <span>Version {s.version}</span>
                <Badge variant="default">{s.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
