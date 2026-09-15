import { randomUUID } from "node:crypto";
import { eq, and } from "drizzle-orm";
import { schema } from "@yaos/database";
import type { Database } from "@yaos/database";
import { ScriptVersionSchema, safeValidate } from "@yaos/agent-schemas";
import type { AIProviderId } from "@yaos/ai-providers";
import { mockScript } from "../mock-fixtures";
import { parseJsonLoose } from "../parse-json";
import { runAgent, logActivity } from "../run-agent";
import { transitionStage } from "../domain";
import { getNextStage } from "@yaos/shared";

export interface RunStoryWriterInput {
  db: Database;
  projectId: string;
  topic: string;
  preferredProvider?: AIProviderId;
}

export async function runStoryWriter({ db, projectId, topic, preferredProvider }: RunStoryWriterInput) {
  const { value } = await runAgent({
    db,
    projectId,
    agentName: "STORY_WRITER",
    preferredProvider,
    userPrompt: `Draft the narration script for topic "${topic}", using only claims marked non-UNVERIFIED.`,
    inputSummary: `topic="${topic}"`,
    build: (rawText, providerId) => (providerId === "MOCK" ? mockScript(topic) : (parseJsonLoose(rawText) as ReturnType<typeof mockScript>)),
    validate: (value) => {
      const result = safeValidate(ScriptVersionSchema, value);
      return result.success ? { success: true } : { success: false, error: result.error };
    },
    outputSummaryOf: (value) => `Script drafted (${value.estimatedWordCount} words, ~${Math.round(value.estimatedDurationSeconds / 60)} min)`,
  });

  // Supersede any existing draft scripts for this project.
  await db
    .update(schema.scripts)
    .set({ status: "SUPERSEDED" })
    .where(and(eq(schema.scripts.projectId, projectId), eq(schema.scripts.status, "DRAFT")));

  const existing = await db.select().from(schema.scripts).where(eq(schema.scripts.projectId, projectId));
  const nextVersion = existing.length + 1;

  const [row] = await db
    .insert(schema.scripts)
    .values({
      id: randomUUID(),
      projectId,
      version: nextVersion,
      status: "DRAFT",
      narrationMarkdown: value.narrationMarkdown,
      estimatedWordCount: value.estimatedWordCount,
      estimatedDurationSeconds: value.estimatedDurationSeconds,
      claimIds: value.claimIds,
    })
    .returning();

  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, projectId));
  if (project && getNextStage(project.currentStage, project.contentType) === "SCRIPT_DRAFTED") {
    await transitionStage(db, projectId, "SCRIPT_DRAFTED", "AGENT", "Story Writer");
  }

  await logActivity(db, projectId, "AGENT", "SCRIPT_DRAFTED", `Script v${nextVersion} drafted.`);
  return row;
}
