import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@yaos/database";
import type { AgentName } from "@yaos/shared";

/**
 * Latest agent_runs row for this project+agent, if any - drives the "still working" UI while a
 * fire-and-forget agent call (see lib/actions/*.ts's use of after()) runs in the background after
 * its triggering request has already returned/redirected.
 */
export async function getLatestAgentRun(projectId: string, agentName: AgentName) {
  const [run] = await db
    .select()
    .from(schema.agentRuns)
    .where(and(eq(schema.agentRuns.projectId, projectId), eq(schema.agentRuns.agentName, agentName)))
    .orderBy(desc(schema.agentRuns.createdAt))
    .limit(1);
  return run ?? null;
}
