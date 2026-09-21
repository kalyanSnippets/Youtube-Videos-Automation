import { randomUUID } from "node:crypto";
import { schema } from "@yaos/database";
import type { Database } from "@yaos/database";
import { IdeaResearchOutputSchema, safeValidate, type IdeaCandidate } from "@yaos/agent-schemas";
import type { AIProviderId } from "@yaos/ai-providers";
import { mockIdeaCandidates } from "../mock-fixtures";
import { parseJsonLoose } from "../parse-json";
import { runAgent, logActivity } from "../run-agent";
import { buildWebSearchContext } from "../research-context";

export interface RunIdeaResearchInput {
  db: Database;
  projectId: string;
  topic: string;
  preferredProvider?: AIProviderId;
}

export async function runIdeaResearch({ db, projectId, topic, preferredProvider }: RunIdeaResearchInput) {
  const researchContext = await buildWebSearchContext(
    topic,
    "Use these to ground trendScore, whyNow, and evergreenScore - do not ignore them",
  );

  const { value, providerUsed } = await runAgent({
    db,
    projectId,
    agentName: "IDEA_RESEARCH",
    preferredProvider,
    userPrompt: `Research 20-30 video ideas for the topic/seed: "${topic}".${researchContext}`,
    inputSummary: `topic="${topic}"`,
    // 20-30 fully detailed idea objects is the single largest structured output in the app -
    // the 8192 default has been observed truncating mid-response for this agent specifically.
    maxOutputTokens: 16000,
    build: (rawText, providerId) => {
      if (providerId === "MOCK") return { ideas: mockIdeaCandidates(topic) };
      return parseJsonLoose(rawText) as { ideas: IdeaCandidate[] };
    },
    validate: (value) => {
      const result = safeValidate(IdeaResearchOutputSchema, value);
      return result.success ? { success: true } : { success: false, error: result.error };
    },
    outputSummaryOf: (value) => `${value.ideas.length} idea candidates generated`,
  });

  const rows = value.ideas.map((idea, i) => ({
    id: randomUUID(),
    projectId,
    workingTitle: idea.workingTitle,
    hook: idea.hook,
    referenceCreator: idea.referenceCreator,
    referenceVideoUrl: idea.referenceVideoUrl,
    whyNow: idea.whyNow,
    audienceProblem: idea.audienceProblem,
    trendScore: idea.trendScore,
    evergreenScore: idea.evergreenScore,
    clickPotential: idea.clickPotential,
    evidenceStrength: idea.evidenceStrength,
    novelty: idea.novelty,
    productionDifficulty: idea.productionDifficulty,
    sponsorFit: idea.sponsorFit,
    proofRequirements: idea.proofRequirements,
    overallScore: idea.overallScore,
    recommendedPresentationMode: idea.recommendedPresentationMode,
    rank: i + 1,
    sourceProvider: providerUsed,
  }));

  const inserted = await db.insert(schema.videoIdeas).values(rows).returning();

  await logActivity(db, projectId, "AGENT", "IDEA_RESEARCH_COMPLETED", `Idea Research completed - ${inserted.length} ideas generated (${providerUsed}).`);

  return inserted;
}
