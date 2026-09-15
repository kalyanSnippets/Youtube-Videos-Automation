import { randomUUID } from "node:crypto";
import { schema } from "@yaos/database";
import type { Database } from "@yaos/database";
import { ReferenceAnalysisSchema, safeValidate } from "@yaos/agent-schemas";
import type { AIProviderId } from "@yaos/ai-providers";
import { mockReferenceAnalysis } from "../mock-fixtures";
import { parseJsonLoose } from "../parse-json";
import { runAgent, logActivity } from "../run-agent";

export interface RunCompetitorAnalysisInput {
  db: Database;
  projectId: string;
  topic: string;
  preferredProvider?: AIProviderId;
}

export async function runCompetitorAnalysis({ db, projectId, topic, preferredProvider }: RunCompetitorAnalysisInput) {
  const count = 3;
  const results = [];
  for (let i = 0; i < count; i++) {
    const { value } = await runAgent({
      db,
      projectId,
      agentName: "COMPETITOR_ANALYST",
      preferredProvider,
      userPrompt: `Analyse reference video #${i + 1} of ${count} for topic "${topic}".`,
      inputSummary: `topic="${topic}" index=${i}`,
      build: (rawText, providerId) => {
        if (providerId === "MOCK") return mockReferenceAnalysis(topic, i);
        return parseJsonLoose(rawText) as ReturnType<typeof mockReferenceAnalysis>;
      },
      validate: (value) => {
        const result = safeValidate(ReferenceAnalysisSchema, value);
        return result.success ? { success: true } : { success: false, error: result.error };
      },
      outputSummaryOf: (value) => `Analysed "${value.title}" (${value.role})`,
    });
    results.push(value);
  }

  const rows = results.map((r) => ({
    id: randomUUID(),
    projectId,
    url: r.url,
    title: r.title,
    channelName: r.channelName,
    role: r.role,
    titleLogic: r.titleLogic,
    thumbnailLogic: r.thumbnailLogic,
    hookAnalysis: r.hookAnalysis,
    first30sAnalysis: r.first30sAnalysis,
    chapterStructure: r.chapterStructure,
    pacingNotes: r.pacingNotes,
    tensionNotes: r.tensionNotes,
    proofSequenceNotes: r.proofSequenceNotes,
    payoffNotes: r.payoffNotes,
    ctaNotes: r.ctaNotes,
    visualNotes: r.visualNotes,
    whyItWorked: r.whyItWorked,
  }));

  const inserted = await db.insert(schema.referenceVideos).values(rows).returning();
  await logActivity(db, projectId, "AGENT", "REFERENCES_ANALYSED", `Reference analysis completed - ${inserted.length} videos analysed.`);
  return inserted;
}
