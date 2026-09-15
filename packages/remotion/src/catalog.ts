/**
 * The full motion template catalog referenced by the Edit Director (see
 * packages/agents) and seeded into the `motion_templates` table. The Edit
 * Director selects a `componentKey` here - it never hand-rolls a scene.
 *
 * `implemented: true` means a real Remotion component exists under
 * ./components and is registered in Root.tsx. The rest are reserved keys
 * with a defined intent so the catalog is complete; building their visuals
 * is tracked in docs/REMOTION.md rather than faked with a copy-pasted stub.
 */
export interface MotionTemplateDef {
  key: string;
  name: string;
  description: string;
  category: "hook" | "typography" | "evidence" | "structure" | "transition" | "cta";
  defaultIntensity: "LOW" | "MEDIUM" | "HIGH";
  implemented: boolean;
}

export const MOTION_TEMPLATE_CATALOG: MotionTemplateDef[] = [
  { key: "HyperHook", name: "Hyper Hook", description: "High-intensity two-line opening hook.", category: "hook", defaultIntensity: "HIGH", implemented: true },
  { key: "HyperTitle", name: "Hyper Title", description: "Kinetic section title card.", category: "typography", defaultIntensity: "MEDIUM", implemented: true },
  { key: "KeywordBurst", name: "Keyword Burst", description: "Rapid single-keyword-per-beat sequence.", category: "typography", defaultIntensity: "HIGH", implemented: true },
  { key: "BrowserFrame", name: "Browser Frame", description: "Wraps footage in browser chrome for real-product credibility.", category: "evidence", defaultIntensity: "LOW", implemented: true },
  { key: "BrowserZoom", name: "Browser Zoom", description: "Ken-Burns style zoom into a region of a browser screenshot.", category: "evidence", defaultIntensity: "MEDIUM", implemented: false },
  { key: "CursorCallout", name: "Cursor Callout", description: "Highlights and annotates a cursor click in screen recording.", category: "evidence", defaultIntensity: "LOW", implemented: false },
  { key: "FeatureTag", name: "Feature Tag", description: "Small animated label pointing at a UI feature.", category: "evidence", defaultIntensity: "LOW", implemented: false },
  { key: "ProductIntro", name: "Product Intro", description: "Logo + one-line pitch intro card for a tool being covered.", category: "structure", defaultIntensity: "MEDIUM", implemented: false },
  { key: "ScoreCard", name: "Score Card", description: "Weighted score breakdown with animated bars.", category: "evidence", defaultIntensity: "MEDIUM", implemented: true },
  { key: "StatCounter", name: "Stat Counter", description: "Animated number count-up for a verified statistic.", category: "evidence", defaultIntensity: "MEDIUM", implemented: true },
  { key: "PriceCard", name: "Price Card", description: "Pricing tier display sourced from an official pricing page.", category: "evidence", defaultIntensity: "LOW", implemented: false },
  { key: "WarningReveal", name: "Warning Reveal", description: "Amber caveat/limitation card.", category: "evidence", defaultIntensity: "MEDIUM", implemented: true },
  { key: "Comparison", name: "Comparison", description: "Side-by-side criteria comparison table.", category: "evidence", defaultIntensity: "MEDIUM", implemented: true },
  { key: "RankingStack", name: "Ranking Stack", description: "Animated ranked list, e.g. top N tools.", category: "structure", defaultIntensity: "MEDIUM", implemented: true },
  { key: "Checklist", name: "Checklist", description: "Sequential check-in list of requirements or steps.", category: "structure", defaultIntensity: "LOW", implemented: true },
  { key: "Timeline", name: "Timeline", description: "Horizontal timeline of dated events.", category: "structure", defaultIntensity: "MEDIUM", implemented: false },
  { key: "MiniChart", name: "Mini Chart", description: "Compact bar/line chart for a data point.", category: "evidence", defaultIntensity: "MEDIUM", implemented: false },
  { key: "ResultReveal", name: "Result Reveal", description: "Dramatic reveal of an experiment's outcome.", category: "hook", defaultIntensity: "HIGH", implemented: false },
  { key: "BeforeAfter", name: "Before / After", description: "Split reveal comparing before and after state.", category: "evidence", defaultIntensity: "MEDIUM", implemented: false },
  { key: "SplitScreen", name: "Split Screen", description: "Two simultaneous video/image panes.", category: "structure", defaultIntensity: "MEDIUM", implemented: false },
  { key: "QuoteCard", name: "Quote Card", description: "Attributed quote card for community sourced sentiment.", category: "evidence", defaultIntensity: "LOW", implemented: false },
  { key: "SectionTransition", name: "Section Transition", description: "Short transition bumper between chapters.", category: "transition", defaultIntensity: "MEDIUM", implemented: false },
  { key: "CTA", name: "CTA", description: "Subscribe / call-to-action card.", category: "cta", defaultIntensity: "LOW", implemented: true },
  { key: "EndScreen", name: "End Screen", description: "Closing end screen with next-video suggestion.", category: "cta", defaultIntensity: "LOW", implemented: true },
];
