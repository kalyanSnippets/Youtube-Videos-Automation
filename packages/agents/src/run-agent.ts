import { randomUUID } from "node:crypto";
import { db as defaultDb, schema } from "@yaos/database";
import type { Database } from "@yaos/database";
import { resolveAIProvider } from "@yaos/ai-providers";
import type { AIProviderId } from "@yaos/ai-providers";
import { getPromptForAgent } from "@yaos/prompts";
import type { AgentName } from "@yaos/shared";
import { eq } from "drizzle-orm";

export interface AgentRunContext<T> {
  db: Database;
  projectId: string;
  agentName: AgentName;
  preferredProvider?: AIProviderId;
  userPrompt: string;
  jsonSchemaHint?: string;
  /** Builds the final structured result. Receives the raw provider text - MOCK's rawText carries a `_mock` flag your builder can ignore, since MOCK runners should build fixtures directly rather than parse it. */
  build: (rawText: string, providerId: AIProviderId) => T;
  /** Validates the built object; return {success:false} to trigger a retry-with-repair (real providers only - MOCK never fails validation). */
  validate: (value: T) => { success: true } | { success: false; error: string };
  inputSummary: string;
  outputSummaryOf: (value: T) => string;
}

export interface AgentRunOutcome<T> {
  agentRunId: string;
  providerUsed: AIProviderId;
  value: T;
}

/**
 * Shared harness every specialized agent runner goes through: resolves the
 * provider (falling back to MOCK if the preferred one isn't configured),
 * calls it, validates structured output, retries once with a repair prompt
 * on validation failure, and records the whole attempt as an agent_run row
 * with agent_messages for traceability. Never persists a result that failed
 * validation twice - it throws so the caller can surface the failure instead
 * of writing malformed data into the project.
 */
export async function runAgent<T>(ctx: AgentRunContext<T>): Promise<AgentRunOutcome<T>> {
  const db = ctx.db ?? defaultDb;
  const provider = resolveAIProvider(ctx.preferredProvider);
  const prompt = getPromptForAgent(ctx.agentName);

  const [run] = await db
    .insert(schema.agentRuns)
    .values({
      id: randomUUID(),
      projectId: ctx.projectId,
      agentName: ctx.agentName,
      status: "RUNNING",
      providerUsed: provider.id,
      inputSummary: ctx.inputSummary,
      startedAt: new Date(),
    })
    .returning();

  await db.insert(schema.agentMessages).values([
    { agentRunId: run.id, role: "system", content: prompt.systemPrompt },
    { agentRunId: run.id, role: "user", content: ctx.userPrompt },
  ]);

  let lastError: string | undefined;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await provider.generate({
        task: ctx.agentName,
        systemPrompt: prompt.systemPrompt,
        userPrompt: attempt === 0 ? ctx.userPrompt : `${ctx.userPrompt}\n\nYour previous output failed validation: ${lastError}\nFix it and respond again with valid JSON only.`,
        jsonSchemaHint: ctx.jsonSchemaHint,
      });
      const value = ctx.build(result.rawText, provider.id);
      const validation = ctx.validate(value);
      if (!validation.success) {
        lastError = validation.error;
        await db.insert(schema.agentMessages).values({
          agentRunId: run.id,
          role: "tool",
          content: `Validation failed (attempt ${attempt + 1}): ${validation.error}`,
        });
        continue;
      }
      await db
        .update(schema.agentRuns)
        .set({
          status: "COMPLETED",
          outputSummary: ctx.outputSummaryOf(value),
          tokensUsed: result.tokensUsed,
          costUsd: result.costUsd,
          retries: attempt,
          finishedAt: new Date(),
        })
        .where(eq(schema.agentRuns.id, run.id));
      return { agentRunId: run.id, providerUsed: provider.id, value };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  await db
    .update(schema.agentRuns)
    .set({ status: "FAILED", errorDetails: lastError, retries: 1, finishedAt: new Date() })
    .where(eq(schema.agentRuns.id, run.id));
  throw new Error(`Agent ${ctx.agentName} failed after retry: ${lastError}`);
}

export async function logActivity(
  db: Database,
  projectId: string,
  actorType: "USER" | "AGENT" | "SYSTEM" | "LOCAL_WORKER",
  action: string,
  summary: string,
  metadata: Record<string, unknown> = {},
) {
  await db.insert(schema.projectActivity).values({
    id: randomUUID(),
    projectId,
    actorType,
    action,
    summary,
    metadata,
  });
}
