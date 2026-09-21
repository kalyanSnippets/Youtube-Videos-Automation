import { randomUUID } from "node:crypto";
import { schema } from "@yaos/database";
import type { Database } from "@yaos/database";
import { ReferenceAnalysisSchema, safeValidate } from "@yaos/agent-schemas";
import type { AIProviderId } from "@yaos/ai-providers";
import { resolveResearchProvider, type YouTubeCompetitorVideo } from "@yaos/research";
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

  let realVideos: YouTubeCompetitorVideo[] = [];
  const researchProvider = resolveResearchProvider();
  if (researchProvider.isAvailable()) {
    try {
      realVideos = await researchProvider.youtubeCompetitorSearch(topic);
    } catch (err) {
      console.warn(`YouTube competitor search failed, falling back to model-generated references: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const results = [];
  for (let i = 0; i < count; i++) {
    const realVideo = realVideos[i];
    // Even with a real video, there's no transcript/frame access - the qualitative analysis
    // (hook, pacing, tension) is still the model's inference from title/channel/metadata, not
    // literal viewing. Only url/title/channelName are guaranteed accurate (overridden below).
    const videoContext = realVideo
      ? `\n\nThis is a REAL video found via YouTube search - title="${realVideo.title}", channel="${realVideo.channelName}", url=${realVideo.url}${realVideo.viewCount ? `, views=${realVideo.viewCount}` : ""}. You cannot watch it; infer likely structure from the title, channel style, and topic conventions.`
      : "";
    const { value } = await runAgent({
      db,
      projectId,
      agentName: "COMPETITOR_ANALYST",
      preferredProvider,
      userPrompt: `Analyse reference video #${i + 1} of ${count} for topic "${topic}".${videoContext}`,
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
    results.push(realVideo ? { ...value, url: realVideo.url, title: realVideo.title, channelName: realVideo.channelName } : value);
  }

  const rows = results.map((r) => ({
    id: randomUUID(),
    projectId,
    url: r.url,
    title: r.title,
    channelName: r.channelName,
    role: r.role,
    presentationMode: r.presentationMode,
    onCameraSegments: r.onCameraSegments,
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
