import { z } from "zod";

/**
 * Structured output contracts for every agent that produces machine-critical
 * data. Agent runners validate raw model output against these schemas before
 * writing to the database; a failed parse triggers a repair-prompt retry
 * rather than silently persisting malformed data (see packages/agents).
 */

export const IdeaCandidateSchema = z.object({
  workingTitle: z.string().min(3),
  hook: z.string().min(3),
  referenceCreator: z.string().optional(),
  referenceVideoUrl: z.string().url().optional(),
  whyNow: z.string(),
  audienceProblem: z.string(),
  trendScore: z.number().int().min(0).max(100),
  evergreenScore: z.number().int().min(0).max(100),
  clickPotential: z.number().int().min(0).max(100),
  evidenceStrength: z.number().int().min(0).max(100),
  novelty: z.number().int().min(0).max(100),
  productionDifficulty: z.number().int().min(0).max(100),
  sponsorFit: z.number().int().min(0).max(100),
  proofRequirements: z.array(z.string()).default([]),
  overallScore: z.number().int().min(0).max(100),
});
export type IdeaCandidate = z.infer<typeof IdeaCandidateSchema>;

export const IdeaResearchOutputSchema = z.object({
  ideas: z.array(IdeaCandidateSchema).min(1),
});
export type IdeaResearchOutput = z.infer<typeof IdeaResearchOutputSchema>;

export const ReferenceAnalysisSchema = z.object({
  url: z.string(),
  title: z.string(),
  channelName: z.string().optional(),
  role: z.enum(["MASTER_REFERENCE", "SUPPORTING"]),
  titleLogic: z.string(),
  thumbnailLogic: z.string(),
  hookAnalysis: z.string(),
  first30sAnalysis: z.string(),
  chapterStructure: z.array(z.object({ label: z.string(), startSeconds: z.number() })).default([]),
  pacingNotes: z.string(),
  tensionNotes: z.string(),
  proofSequenceNotes: z.string(),
  payoffNotes: z.string(),
  ctaNotes: z.string(),
  visualNotes: z.string(),
  whyItWorked: z.string(),
});
export type ReferenceAnalysis = z.infer<typeof ReferenceAnalysisSchema>;

export const ClaimSourceSchema = z.object({
  kind: z.enum(["OFFICIAL", "INDEPENDENT", "COMMUNITY", "OUR_TEST"]),
  title: z.string(),
  publisher: z.string().optional(),
  url: z.string().optional(),
  publishedDate: z.string().optional(),
  relevance: z.string().optional(),
});

export const ClaimSchema = z.object({
  claimText: z.string().min(3),
  claimType: z.enum(["FACT", "OUR_TEST", "COMMUNITY", "OPINION", "UNVERIFIED"]),
  confidence: z.number().int().min(0).max(100),
  safeWording: z.string().optional(),
  forbiddenWording: z.string().optional(),
  contraryEvidence: z.string().optional(),
  proofAssetRequired: z.boolean().default(false),
  sourceFreshness: z.string().optional(),
  sources: z.array(ClaimSourceSchema).default([]),
});
export type Claim = z.infer<typeof ClaimSchema>;

export const MethodologySchema = z.object({
  samePromptOrInput: z.string(),
  numberOfAttempts: z.number().int().min(1),
  accountTier: z.string(),
  locationRegion: z.string(),
  durationNotes: z.string(),
  resolutionNotes: z.string(),
  scoringMetrics: z.array(z.object({ metric: z.string(), weight: z.number() })).min(1),
  inclusionRules: z.string(),
  exclusionRules: z.string(),
  tierDefinitions: z.string(),
});
export type Methodology = z.infer<typeof MethodologySchema>;

export const ScriptVersionSchema = z.object({
  narrationMarkdown: z.string().min(10),
  estimatedWordCount: z.number().int().positive(),
  estimatedDurationSeconds: z.number().int().positive(),
  claimIds: z.array(z.string()).default([]),
});
export type ScriptVersion = z.infer<typeof ScriptVersionSchema>;

export const ProductionSceneSchema = z.object({
  sceneNumber: z.number().int().positive(),
  timeEstimateSeconds: z.number().int().positive(),
  narration: z.string(),
  storyPurpose: z.string(),
  viewerMustSee: z.string(),
  whyThisVisual: z.string(),
  claimIds: z.array(z.string()).default([]),
  proofRequired: z.string().optional(),
  assetType: z.string(),
  assetFilename: z.string(),
  toolToUse: z.string(),
  captureOrGenerationSteps: z.string(),
  exactGenerationPrompt: z.string().optional(),
  screenRecordingInstructions: z.string().optional(),
  privacyWarnings: z.string().optional(),
  motionComponent: z.string(),
  motionIntensity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  onScreenText: z.string().optional(),
  captionEmphasis: z.string().optional(),
  sfx: z.string().optional(),
  transition: z.string().optional(),
  editorInstruction: z.string().optional(),
  fallbackIfAssetMissing: z.string(),
});
export type ProductionScene = z.infer<typeof ProductionSceneSchema>;

export const AssetRequirementSchema = z.object({
  expectedFilename: z.string(),
  category: z.string(),
  instructions: z.string(),
  shotType: z.enum(["SCREEN_RECORDING", "GENERATIVE"]),
  software: z.string().optional(),
  shortcut: z.string().optional(),
  windowSetup: z.string().optional(),
  exactSequence: z.string().optional(),
  cursorBehavior: z.string().optional(),
  durationSeconds: z.number().optional(),
  exportFormat: z.string().optional(),
  toolOrModel: z.string().optional(),
  prompt: z.string().optional(),
  negativePrompt: z.string().optional(),
  aspectRatio: z.string().optional(),
  maxAttempts: z.number().optional(),
  acceptanceCriteria: z.string().optional(),
});
export type AssetRequirement = z.infer<typeof AssetRequirementSchema>;

export const EditSceneSchema = z.object({
  sceneOrder: z.number().int(),
  startMs: z.number().int(),
  endMs: z.number().int(),
  storyFunction: z.string(),
  intensity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  primaryAssetFilename: z.string().optional(),
  backupAssetFilename: z.string().optional(),
  component: z.string(),
  onScreenText: z.string().optional(),
  captionEmphasis: z.string().optional(),
  cameraMotion: z.string().optional(),
  transition: z.string().optional(),
  sfx: z.string().optional(),
  proofOverlay: z.string().optional(),
  claimIds: z.array(z.string()).default([]),
});
export type EditScene = z.infer<typeof EditSceneSchema>;

export const QAIssueSchema = z.object({
  timeCodeMs: z.number().int().optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  problem: z.string(),
  whyItHurts: z.string(),
  fix: z.string(),
  assetOrComponentNeeded: z.string().optional(),
});
export type QAIssue = z.infer<typeof QAIssueSchema>;

export const PublishPackageSchema = z.object({
  titleOptions: z.array(z.object({ title: z.string(), score: z.number(), rationale: z.string().optional() })).min(1),
  thumbnailConcepts: z.array(z.object({ concept: z.string(), text: z.string() })).min(1),
  description: z.string(),
  chapters: z.array(z.object({ label: z.string(), startSeconds: z.number() })),
  sourceList: z.array(z.object({ title: z.string(), url: z.string() })),
  disclosures: z.string().optional(),
  pinnedComment: z.string(),
  keywords: z.array(z.string()),
  communityPost: z.string(),
});
export type PublishPackage = z.infer<typeof PublishPackageSchema>;

export const AnalyticsReviewSchema = z.object({
  postmortem: z.string(),
  whatToRepeat: z.array(z.string()),
  whatToChange: z.array(z.string()),
  ideaPatternLearnings: z.array(z.string()),
});
export type AnalyticsReview = z.infer<typeof AnalyticsReviewSchema>;

export const CommunityConsensusSchema = z.object({
  topic: z.string(),
  commonPraise: z.array(z.string()),
  commonCriticism: z.array(z.string()),
  disagreement: z.string(),
  frequencyNotes: z.string(),
  sentiment: z.enum(["STRONGLY_POSITIVE", "MOSTLY_POSITIVE", "MIXED", "MOSTLY_NEGATIVE", "WEAK_CONSENSUS"]),
  confidence: z.number().int().min(0).max(100),
  sourceCount: z.number().int().min(0),
});
export type CommunityConsensus = z.infer<typeof CommunityConsensusSchema>;

/** Validate `raw` against `schema`; never throws - callers use the discriminated result to decide whether to retry with a repair prompt. */
export function safeValidate<T>(schema: z.ZodType<T>, raw: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(raw);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
}
