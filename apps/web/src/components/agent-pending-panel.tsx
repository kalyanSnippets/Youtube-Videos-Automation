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
  return (
    <div className="panel p-10 text-center text-text-dim text-sm space-y-2">
      <p>Working on it - a real model call can take a couple of minutes.</p>
      <AutoRefresh />
    </div>
  );
}
