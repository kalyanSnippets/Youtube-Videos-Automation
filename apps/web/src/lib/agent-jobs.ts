import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@yaos/database";
import { markAgentStepQueued, runAgentStep, STEP_PATHS, type AgentStep } from "@yaos/agents";

/**
 * Start an agent step without making the click wait for it.
 *
 * On Netlify a normal request is stopped about 10 seconds after it answers, which kills a model
 * call running in after(). There the step goes to the agent-run-background function, which may
 * run for 15 minutes. Locally (next dev / next start) it still runs in after().
 */
function backgroundUrl(): string | null {
  if (process.env.AGENT_BACKGROUND === "off") return null;
  const onNetlify = Boolean(process.env.NETLIFY || process.env.SITE_ID || process.env.DEPLOY_ID);
  const base = process.env.URL ?? process.env.SITE_URL;
  if (!onNetlify || !base || !process.env.APP_SECRET) return null;
  return `${base.replace(/\/$/, "")}/.netlify/functions/agent-run-background`;
}

export async function startAgentStep(projectId: string, step: AgentStep): Promise<void> {
  await markAgentStepQueued(db, projectId, step).catch((error) => console.error("[agents] could not record queued step:", error));
  const url = backgroundUrl();
  if (url) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { authorization: `Bearer ${process.env.APP_SECRET}`, "content-type": "application/json" },
        body: JSON.stringify({ projectId, step }),
        signal: AbortSignal.timeout(5000),
      });
      // Background functions answer 202 straight away and keep working.
      if (response.ok) return;
      console.error(`[agents] background start for ${step} returned ${response.status}; running inline instead`);
    } catch (error) {
      console.error(`[agents] background start for ${step} failed; running inline instead:`, error);
    }
  }
  after(async () => {
    try {
      await runAgentStep(db, projectId, step);
    } catch (err) {
      console.error(`Background ${step} failed for project ${projectId}:`, err);
    }
    revalidatePath(`/projects/${projectId}`);
    for (const p of STEP_PATHS[step]) revalidatePath(`/projects/${projectId}/${p}`);
  });
}
