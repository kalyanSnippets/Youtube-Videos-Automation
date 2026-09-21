import type {
  ArollShot,
  AssetRequirement,
  Claim,
  IdeaCandidate,
  Methodology,
  ProductionScene,
  PublishPackage,
  QAIssue,
  ReferenceAnalysis,
  ScriptVersion,
} from "@yaos/agent-schemas";
import type { ContentType, PresentationMode } from "@yaos/shared";

/**
 * Deterministic MOCK content generators. These stand in for a real
 * AI+research call: they are templated from the project's own title/topic so
 * demo data reads coherently, but they are NOT real research and must never
 * be presented as such - callers tag every row they produce with
 * sourceProvider/providerUsed = "MOCK" and the UI renders a MOCK badge.
 */

/** Matches the real IDEA_RESEARCH agent's v2 behavior of committing to one recommended idea
 * rather than returning a ranked list - see packages/prompts/src/idea-research/v2.ts. */
export function mockIdeaCandidates(topic: string): IdeaCandidate[] {
  return [
    {
      workingTitle: `${topic}: the free-tier reality check`,
      hook: `Most videos about ${topic} skip the part that actually matters - so we went and checked it ourselves.`,
      referenceCreator: "Benchmark Creator Co.",
      whyNow: `Search interest and community discussion around "${topic}" has picked up in the last few weeks.`,
      audienceProblem: `Viewers can't tell if claims about ${topic} are still accurate after recent changes.`,
      trendScore: 61,
      evergreenScore: 70,
      clickPotential: 65,
      evidenceStrength: 48,
      novelty: 53,
      productionDifficulty: 40,
      sponsorFit: 25,
      proofRequirements: ["Official pricing/feature page screenshot", "Our own recorded test run"],
      overallScore: 67,
      recommendedPresentationMode: "HYBRID" as PresentationMode,
    },
  ];
}

/** Cycles through the three presentation modes across reference videos so the Competitor Analyst's output reflects that references come in all three - never just faceless. */
const REFERENCE_PRESENTATION_MODES: PresentationMode[] = ["HYBRID", "FACELESS", "FACE_LED"];

const REFERENCE_ON_CAMERA_SEGMENTS: Record<PresentationMode, { startSeconds: number; endSeconds: number; purpose: string }[]> = {
  HYBRID: [
    { startSeconds: 0, endSeconds: 12, purpose: "personal hook - states the test in first person" },
    { startSeconds: 40, endSeconds: 52, purpose: "reaction to the first result" },
    { startSeconds: 380, endSeconds: 410, purpose: "on-camera verdict" },
  ],
  FACELESS: [],
  FACE_LED: [
    { startSeconds: 0, endSeconds: 25, purpose: "talking-head hook and setup" },
    { startSeconds: 25, endSeconds: 90, purpose: "explanation with screen inserts" },
    { startSeconds: 90, endSeconds: 130, purpose: "reaction to proof" },
    { startSeconds: 350, endSeconds: 400, purpose: "on-camera verdict and CTA" },
  ],
};

export function mockReferenceAnalysis(topic: string, index: number): ReferenceAnalysis {
  const presentationMode = REFERENCE_PRESENTATION_MODES[index % REFERENCE_PRESENTATION_MODES.length];
  return {
    url: `https://www.youtube.com/watch?v=mock-reference-${index}`,
    title: `${topic} - what nobody tells you`,
    channelName: index === 0 ? "Benchmark Creator Co." : `Creator ${index}`,
    role: index === 0 ? "MASTER_REFERENCE" : "SUPPORTING",
    presentationMode,
    onCameraSegments: REFERENCE_ON_CAMERA_SEGMENTS[presentationMode],
    titleLogic: "Uses a curiosity gap ('what nobody tells you') without over-promising a specific number.",
    thumbnailLogic: "High-contrast close-up expression plus a single bold claim word, no more than 4 words of text.",
    hookAnalysis: "Opens on the payoff moment first, then rewinds to explain how they got there.",
    first30sAnalysis: "States the question, shows the stakes, promises a concrete answer by a specific timestamp.",
    chapterStructure: [
      { label: "Cold open", startSeconds: 0 },
      { label: "Setup", startSeconds: 25 },
      { label: "Test/Proof", startSeconds: 120 },
      { label: "Verdict", startSeconds: 380 },
    ],
    pacingNotes: "Cuts every 3-5 seconds during proof section, slows down for the verdict.",
    tensionNotes: "Withholds the final number until the last third of the video.",
    proofSequenceNotes: "Shows raw screen recording before any graphic overlay, so the proof reads as unedited.",
    payoffNotes: "Verdict is stated plainly in one sentence, then justified.",
    ctaNotes: "Subscribe ask comes after the payoff, not before.",
    visualNotes: "Consistent lower-third caption style, sparing use of high-intensity motion.",
    whyItWorked: "Front-loaded curiosity plus visible, unedited proof builds trust quickly.",
  };
}

export function mockClaims(topic: string): Claim[] {
  return [
    {
      claimText: `${topic} offers a free tier with limited usage.`,
      claimType: "FACT",
      confidence: 90,
      safeWording: "According to the official pricing page, the free tier includes limited usage.",
      forbiddenWording: "It's completely free with no limits.",
      proofAssetRequired: true,
      sourceFreshness: "Checked this month",
      sources: [
        {
          kind: "OFFICIAL",
          title: "Official pricing page",
          publisher: topic,
          url: `https://example.com/${topic.toLowerCase().replace(/\s+/g, "-")}/pricing`,
          relevance: "Primary source for plan limits.",
        },
      ],
    },
    {
      claimText: `Our test run produced usable output within the free tier's limits.`,
      claimType: "OUR_TEST",
      confidence: 80,
      safeWording: "In our test run, we were able to produce usable output before hitting the free tier limit.",
      proofAssetRequired: true,
      sources: [{ kind: "OUR_TEST", title: "Internal test recording", relevance: "Primary evidence for this claim." }],
    },
    {
      claimText: `Many users report the free tier resets weekly, not daily.`,
      claimType: "COMMUNITY",
      confidence: 55,
      safeWording: "Several community threads report the reset happens weekly, though this isn't universally confirmed.",
      proofAssetRequired: false,
      sources: [
        { kind: "COMMUNITY", title: "r/relevant-subreddit discussion thread", relevance: "Recurring community report." },
      ],
    },
    {
      claimText: `This is the best free option available right now.`,
      claimType: "OPINION",
      confidence: 60,
      safeWording: "In our opinion, this is currently the strongest free option for beginners.",
      proofAssetRequired: false,
      sources: [],
    },
    {
      claimText: `The tool will always remain free for individual creators.`,
      claimType: "UNVERIFIED",
      confidence: 10,
      safeWording: "We could not confirm any long-term pricing commitment beyond the current stated plan.",
      forbiddenWording: "It will always be free.",
      contraryEvidence: "No official statement found guaranteeing future pricing.",
      proofAssetRequired: false,
      sources: [],
    },
  ];
}

export function mockMethodology(topic: string): Methodology {
  return {
    samePromptOrInput: `Identical input prompt used across every tool being evaluated for ${topic}.`,
    numberOfAttempts: 3,
    accountTier: "Free tier, freshly created account",
    locationRegion: "US region, VPN-controlled",
    durationNotes: "Each attempt capped at 10 minutes of generation time.",
    resolutionNotes: "Output captured at the tool's maximum available free-tier resolution.",
    scoringMetrics: [
      { metric: "Output quality", weight: 40 },
      { metric: "Speed", weight: 25 },
      { metric: "Reliability across attempts", weight: 35 },
    ],
    inclusionRules: "Only the officially documented free tier is evaluated, not trial credits requiring a card.",
    exclusionRules: "Referral-earned credits and beta-only access are excluded from the free-tier comparison.",
    tierDefinitions: "Free = no payment method required at signup and no auto-charge after a trial period.",
  };
}

export function mockScript(topic: string): ScriptVersion {
  const narrationMarkdown = `You've probably seen a dozen videos claiming ${topic} is completely free. We wanted to know if that's actually true - so instead of reading the marketing page out loud, we made an account, ran our own test, and checked what the community has been saying for months.

Here's what the official pricing page actually promises, word for word, and where the line gets blurry.

We ran the same test three times, on a brand new free account, no tricks. Here's exactly what happened - including the part where it almost didn't work.

The community consensus isn't as clean as either side of this argument wants you to believe. Some of it holds up. Some of it doesn't.

So is it worth using on the free tier? Here's our honest verdict, and what we'd actually recommend depending on what you're trying to do.`;
  const estimatedWordCount = narrationMarkdown.split(/\s+/).length;
  return {
    narrationMarkdown,
    estimatedWordCount,
    estimatedDurationSeconds: Math.round((estimatedWordCount / 150) * 60),
    claimIds: [],
  };
}

/**
 * Presentation-mode-aware production plan. FACELESS keeps every beat as
 * VOICEOVER/SCREEN_RECORDING; HYBRID opens and closes on camera around a
 * faceless proof core; FACE_LED adds an on-camera explanation beat too and
 * treats the screen recording as an insert that interrupts the A-roll
 * rather than a self-contained scene. Never invents on-camera footage for a
 * FACELESS project, and never forces the creator to stay off-camera for
 * HYBRID/FACE_LED.
 */
export function mockProductionScenes(topic: string, presentationMode: PresentationMode): ProductionScene[] {
  const scenes: ProductionScene[] = [];
  const onCamera = presentationMode !== "FACELESS";

  scenes.push(
    onCamera
      ? {
          sceneNumber: 0,
          segmentType: "ON_CAMERA",
          timeEstimateSeconds: 10,
          narration: `I tested seven tools that all claim to solve ${topic} - here's what actually happened.`,
          storyPurpose: "Hook - personal, first-person framing raises the stakes before any proof is shown",
          viewerMustSee: "Creator speaking directly to camera, high energy, no wasted words",
          whyThisVisual: "A personal claim delivered on camera reads as more credible than a title card making the same claim",
          claimIds: [],
          assetType: "on_camera",
          assetFilename: "a-roll-hook-001.mp4",
          toolToUse: "Camera + tripod (see A-roll shot 1 for framing)",
          captureOrGenerationSteps: "Film medium close-up, direct to lens, high energy delivery. Do not read from a script on screen.",
          motionComponent: "TalkingHeadFrame",
          motionIntensity: "HIGH",
          onScreenText: `"${topic}"?`,
          captionEmphasis: "tested",
          sfx: "whoosh-in",
          transition: "hard-cut",
          fallbackIfAssetMissing: "Use HyperHook typography-only treatment with the claim as animated text instead of on-camera footage.",
          screenInsertInterrupts: false,
          punchIn: false,
        }
      : {
          sceneNumber: 0,
          segmentType: "VOICEOVER",
          timeEstimateSeconds: 15,
          narration: `You've probably seen a dozen videos claiming ${topic} is completely free.`,
          storyPurpose: "Hook - establish the curiosity gap",
          viewerMustSee: "A fast montage of other thumbnails/titles making the 'free' claim",
          whyThisVisual: "Shows the viewer this is a real, common claim worth investigating",
          claimIds: [],
          assetType: "screen_recording",
          assetFilename: "hook-thumbnail-montage.mp4",
          toolToUse: "Screen recorder (browser, YouTube search results)",
          captureOrGenerationSteps: "Search the topic on YouTube, scroll slowly through 6-8 results with 'free' in the title/thumbnail.",
          screenRecordingInstructions: "Record at 1080p, 15-20 seconds, mouse movement smooth and slow.",
          privacyWarnings: "Ensure no personal Google account info is visible in the browser chrome.",
          motionComponent: "HyperHook",
          motionIntensity: "HIGH",
          onScreenText: "\"COMPLETELY FREE\"?",
          captionEmphasis: "FREE",
          sfx: "whoosh-in",
          transition: "hard-cut",
          fallbackIfAssetMissing: "Use HyperHook typography-only treatment with the claim as animated text.",
          screenInsertInterrupts: false,
          punchIn: false,
        },
  );

  if (presentationMode === "FACE_LED") {
    scenes.push({
      sceneNumber: 0,
      segmentType: "ON_CAMERA",
      timeEstimateSeconds: 18,
      narration: `Here's exactly how I set this test up, and why it matters for anyone using ${topic}.`,
      storyPurpose: "Explanation - a face-led format keeps the creator present for the reasoning, not just the punchline",
      viewerMustSee: "Creator explaining the test setup, screen inserts cutting in briefly to illustrate specific points",
      whyThisVisual: "Keeps personality and trust front-and-center through the explanation, which a pure voiceover would flatten",
      claimIds: [],
      assetType: "on_camera",
      assetFilename: "a-roll-explanation-002.mp4",
      toolToUse: "Camera + tripod (see A-roll shot 2)",
      captureOrGenerationSteps: "Film seated, conversational energy, pause naturally where a screen insert will cut in.",
      motionComponent: "ScreenAndFaceSplit",
      motionIntensity: "MEDIUM",
      onScreenText: "The setup",
      captionEmphasis: "setup",
      transition: "cut",
      fallbackIfAssetMissing: "Use Checklist typography-only treatment describing the setup.",
      screenInsertInterrupts: false,
      punchIn: false,
    });
  }

  scenes.push({
    sceneNumber: 0,
    segmentType: "SCREEN_RECORDING",
    timeEstimateSeconds: 20,
    narration: "Here's what the official pricing page actually promises, word for word.",
    storyPurpose: "Establish the primary source before making any claim",
    viewerMustSee: "The real, current official pricing page for the product",
    whyThisVisual: "Grounds the video in a verifiable primary source, not a secondhand claim",
    claimIds: [],
    proofRequired: "Official pricing page screenshot/recording",
    assetType: "screenshot",
    assetFilename: "official-pricing-page.png",
    toolToUse: "Browser screenshot",
    captureOrGenerationSteps: "Navigate to the official pricing page, capture the full free-tier section only.",
    screenRecordingInstructions: "Full-page screenshot, crop to the relevant pricing card only.",
    privacyWarnings: "Remove any personal account banner if logged in.",
    motionComponent: "BrowserFrame",
    motionIntensity: "LOW",
    onScreenText: "Official source",
    captionEmphasis: "official",
    transition: "cross-dissolve",
    fallbackIfAssetMissing: "Use WarningReveal stating the source could not be captured and cite the URL verbally only.",
    screenInsertInterrupts: onCamera,
    punchIn: false,
  });

  scenes.push({
    sceneNumber: 0,
    segmentType: presentationMode === "FACELESS" ? "VOICEOVER" : "PRODUCT_RESULT",
    timeEstimateSeconds: 45,
    narration: "We ran the same test three times, on a brand new free account, no tricks.",
    storyPurpose: "Deliver the OUR_TEST evidence",
    viewerMustSee: "Real screen recording of the test attempts, including the failure/limit moment",
    whyThisVisual: "OUR_TEST claims require primary evidence, not a description",
    claimIds: [],
    proofRequired: "Our test recording",
    assetType: "screen_recording",
    assetFilename: "our-test-run.mp4",
    toolToUse: "Screen recorder + the product itself",
    captureOrGenerationSteps: "Follow the locked methodology exactly: same prompt, fresh account, record start to limit.",
    screenRecordingInstructions: "Record full session unedited, note the timestamp where the limit is hit.",
    privacyWarnings: "Use a disposable test account, not a personal one.",
    motionComponent: "ScoreCard",
    motionIntensity: "MEDIUM",
    onScreenText: "Attempt 1 / 3",
    captionEmphasis: "test",
    sfx: "tick",
    transition: "cut",
    fallbackIfAssetMissing: "Use Checklist component to describe the methodology while flagging the recording as pending.",
    screenInsertInterrupts: onCamera,
    punchIn: false,
  });

  if (onCamera) {
    scenes.push({
      sceneNumber: 0,
      segmentType: "ON_CAMERA",
      timeEstimateSeconds: 12,
      narration: "But one of them burned through its entire free allowance in two generations.",
      storyPurpose: "Reaction/verdict - a genuine human reaction sells a surprising result harder than a stat card alone",
      viewerMustSee: "Creator reacting to the actual result, then delivering the verdict straight to camera",
      whyThisVisual: "The channel's identity is proof plus personality - the verdict is where that personality should show",
      claimIds: [],
      assetType: "on_camera",
      assetFilename: "a-roll-verdict-003.mp4",
      toolToUse: "Camera + tripod (see A-roll shot 3)",
      captureOrGenerationSteps: "Film after reviewing the actual test footage so the reaction is genuine, not performed cold.",
      motionComponent: "TalkingHeadFrame",
      motionIntensity: "MEDIUM",
      onScreenText: "2 generations. Done.",
      captionEmphasis: "burned through",
      transition: "cut",
      fallbackIfAssetMissing: "Use WarningReveal typography-only treatment instead of the on-camera reaction.",
      screenInsertInterrupts: false,
      punchIn: true,
    });
  }

  return scenes.map((scene, i) => ({ ...scene, sceneNumber: i + 1 }));
}

/**
 * A-roll shot list for the ON_CAMERA scenes above - only meaningful for
 * FACE_LED/HYBRID projects. Filenames match the corresponding production
 * scene's assetFilename so the two stay linked.
 */
export function mockArollShots(scenes: ProductionScene[]): ArollShot[] {
  const onCameraScenes = scenes.filter((s) => s.segmentType === "ON_CAMERA");
  return onCameraScenes.map((scene, i) => ({
    shotNumber: i + 1,
    narration: scene.narration,
    shotType: i === 0 ? "Medium close-up" : "Medium shot",
    cameraPosition: "Eye level",
    framing: i === 0 ? "Chest-up" : "Waist-up",
    energy: scene.storyPurpose.toLowerCase().includes("reaction") || scene.storyPurpose.toLowerCase().includes("verdict") ? "High / genuine reaction" : "High / curious",
    durationMinSeconds: Math.max(4, scene.timeEstimateSeconds - 3),
    durationMaxSeconds: scene.timeEstimateSeconds + 3,
    delivery: "Direct to lens",
    standingOrSeated: "standing",
    backgroundSuggestion: "Clean desk / technology setup",
    props: undefined,
    screenInsertInterrupts: scene.screenInsertInterrupts,
    punchIn: scene.punchIn,
    captionsOnScreen: true,
    cameraGuidance: "iPhone rear camera, 4K/30fps, locked exposure/focus, tripod, eye-level framing.",
    filename: scene.assetFilename,
  }));
}

/**
 * Screen-recording/generative asset requirements only - A-roll (on-camera)
 * capture requirements live in aroll_shots instead, since on-camera assets
 * are the Production Director's responsibility per the product spec, not
 * the Asset Planner's. The hook montage item only applies when the hook
 * itself is a screen recording (FACELESS) rather than on-camera footage.
 */
export function mockAssetRequirements(presentationMode: PresentationMode): AssetRequirement[] {
  const hookItem: AssetRequirement[] =
    presentationMode === "FACELESS"
      ? [
          {
            expectedFilename: "hook-thumbnail-montage.mp4",
            category: "screen_recording",
            shotType: "SCREEN_RECORDING",
            instructions: "Record 15-20s of scrolling through competitor video thumbnails on the topic search results page.",
            software: "OBS Studio / QuickTime",
            shortcut: "Cmd+Shift+5 (Mac) or OBS hotkey",
            windowSetup: "Full-screen browser, no bookmarks bar visible",
            exactSequence: "Search topic -> scroll slowly through results -> stop on 2-3 relevant thumbnails",
            cursorBehavior: "Smooth scroll, no clicking",
            durationSeconds: 20,
            exportFormat: "mp4 (H.264)",
          },
        ]
      : [];

  return [
    ...hookItem,
    {
      expectedFilename: "official-pricing-page.png",
      category: "screenshot",
      shotType: "SCREEN_RECORDING",
      instructions: "Full-page screenshot of the official pricing page, cropped to the free-tier card.",
      software: "Browser full-page screenshot extension",
      windowSetup: "Logged out, default browser zoom",
      exactSequence: "Navigate to /pricing, wait for full load, capture, crop.",
      exportFormat: "png",
    },
    {
      expectedFilename: "our-test-run.mp4",
      category: "screen_recording",
      shotType: "SCREEN_RECORDING",
      instructions: "Unedited recording of the full test session per the locked methodology.",
      software: "OBS Studio",
      windowSetup: "Fresh/incognito browser session, disposable test account",
      exactSequence: "Start recording -> log in -> run identical prompt -> continue until limit reached -> stop recording",
      cursorBehavior: "Natural, no scripted movements",
      durationSeconds: 600,
      exportFormat: "mp4 (H.264)",
    },
  ];
}

export function mockQAIssues(): QAIssue[] {
  return [
    {
      timeCodeMs: 12000,
      severity: "HIGH",
      problem: "Caption text overlaps the browser chrome URL bar during the pricing page reveal.",
      whyItHurts: "Obscures the primary source URL, weakening the FACT claim's credibility.",
      fix: "Move caption to lower third and reduce BrowserFrame content area padding.",
      assetOrComponentNeeded: "BrowserFrame caption offset",
    },
    {
      timeCodeMs: 145000,
      severity: "MEDIUM",
      problem: "Our test run clip is a static screen for 8 seconds with no cuts.",
      whyItHurts: "Retention risk during the proof section, the most important evidence beat.",
      fix: "Insert a ScoreCard cutaway summarizing progress every 3-4 seconds during the test.",
      assetOrComponentNeeded: "ScoreCard",
    },
  ];
}

export function mockPublishPackage(topic: string, contentType: ContentType): PublishPackage {
  return {
    titleOptions: [
      { title: `Is ${topic} Actually Free? We Tested It.`, score: 82, rationale: "Direct question hook plus proof framing." },
      { title: `${topic}: The Free Tier Truth`, score: 74, rationale: "Shorter, slightly less curiosity-driven." },
      { title: `We Tried ${topic} For Free (Honest Results)`, score: 78, rationale: "Personal framing, promises honesty." },
    ],
    thumbnailConcepts: [
      { concept: "Split screen: pricing page vs. our test result", text: "FREE?" },
      { concept: "Shocked reaction over blurred limit-reached screen", text: "NOT QUITE" },
    ],
    description: `We wanted to know if ${topic} is really free, so we checked the official pricing page, ran our own ${contentType === "experiment" ? "experiment" : "test"}, and looked at what the community has been saying. Full breakdown and sources below.`,
    chapters: [
      { label: "The claim", startSeconds: 0 },
      { label: "What the pricing page says", startSeconds: 25 },
      { label: "Our test", startSeconds: 120 },
      { label: "Community consensus", startSeconds: 280 },
      { label: "Verdict", startSeconds: 380 },
    ],
    sourceList: [{ title: "Official pricing page", url: `https://example.com/${topic.toLowerCase().replace(/\s+/g, "-")}/pricing` }],
    disclosures: "Not sponsored. No affiliate links used in this video.",
    pinnedComment: "What's your experience with the free tier? Drop it below - curious if our results match yours.",
    keywords: [topic, `${topic} free`, `${topic} review`, `${topic} pricing`],
    communityPost: `New video: we actually tested whether ${topic} is free. Results were more interesting than we expected.`,
  };
}
