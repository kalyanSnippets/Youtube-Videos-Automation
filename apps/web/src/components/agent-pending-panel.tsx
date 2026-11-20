import { schema } from "@yaos/database";
import { AutoRefresh } from "./auto-refresh";

type AgentRun = typeof schema.agentRuns.$inferSelect;

/**
 * Renders in place of a tab's "nothing here yet" empty state. An agent trigger now returns
 * immediately and runs in the background (see lib/actions/*.ts's use of after()), so without this
 * the user would stare at a plain empty panel for however long the real model call takes.
 */
export function AgentPendingPanel({ run, emptyLabel }: { run: AgentRun | null; emptyLabel: string }) {
  if (!run || run.status === "COMPLETED") {
    return <div className="panel p-10 text-center text-text-dim text-sm">{emptyLabel}</div>;
  }
  if (run.status === "FAILED") {
    return (
      <div className="panel p-10 text-center text-sm space-y-2">
        <p className="text-status-danger font-medium">Last run failed</p>
        <p className="text-text-dim text-xs">{run.errorDetails ?? "Unknown error - see Agent Runs for details."}</p>
      </div>
    );
  }
  // A background run can be cut off (deploy, crash) and never write FAILED. Past these ages it is
  // not coming back, so say so instead of spinning forever.
  const age = Date.now() - run.createdAt.getTime();
  const stuck = run.status === "QUEUED" ? age > 3 * 60_000 : age > 16 * 60_000;
  if (stuck) {
    return (
      <div className="panel p-10 text-center text-sm space-y-2">
        <p className="text-status-danger font-medium">This run stopped before it finished</p>
        <p className="text-text-dim text-xs">Click the re-run button above to try again.</p>
      </div>
    );
  }
  return (
    <div className="panel p-10 text-center text-text-dim text-sm space-y-2">
      <p>{run.status === "QUEUED" ? "Starting…" : "Working on it - a real model call can take a couple of minutes."}</p>
      <AutoRefresh />
    </div>
  );
}
