/**
 * Netlify background function (the "-background" suffix gives it 15 minutes instead of ~10
 * seconds). The admin app posts { projectId, step } here when you click Start New Video or
 * re-run an agent; this runs the AI step and writes the results to the database. The project
 * page refreshes itself until the run finishes. Needs APP_SECRET on the site.
 */
import { db } from "../../packages/database/src/index.ts";
import { isAgentStep, runAgentStep } from "../../packages/agents/src/index.ts";

export default async function agentRunBackground(request: Request): Promise<Response> {
  const secret = process.env.APP_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    console.log("[agents] rejected: bad or missing APP_SECRET");
    return new Response("unauthorized", { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as { projectId?: unknown; step?: unknown };
  if (typeof body.projectId !== "string" || !isAgentStep(body.step)) {
    console.log("[agents] rejected: bad body", body);
    return new Response("bad request", { status: 400 });
  }
  const started = Date.now();
  try {
    await runAgentStep(db, body.projectId, body.step);
    console.log(`[agents] ${body.step} for ${body.projectId} finished in ${Math.round((Date.now() - started) / 1000)}s`);
  } catch (error) {
    // runAgent already marks the agent_runs row FAILED with the reason, which the page shows.
    console.error(`[agents] ${body.step} for ${body.projectId} failed:`, error);
  }
  return new Response("done");
}

// The "-background" name already does this; the explicit flag is what current Netlify docs use.
export const config = { background: true };
