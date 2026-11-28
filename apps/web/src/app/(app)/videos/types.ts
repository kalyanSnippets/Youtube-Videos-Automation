export interface VideoRowData {
  id: string;
  platform: string;
  format: string | null;
  title: string;
  watchUrl: string;
  publishedAt: string | null;
  slug: string;
  hidden: boolean;
  /** Thumbnail address (YouTube's own image servers, or our Instagram proxy). */
  thumb: string;
  /** "prompt" or "resource" as shown to viewers; contentKind is the saved choice (null = automatic). */
  kind: "prompt" | "resource";
  contentKind: string | null;
  /** Comment bot switch for this video. */
  botEnabled: boolean;
  keyword: string | null;
  resourceTitle: string | null;
  prompt: string | null;
  promptSource: string | null;
  promptFilename: string | null;
  /** The uploaded document viewers download, if any. */
  attachment: { name: string; size: number | null } | null;
  extraLink: string | null;
  /** YouTube Analytics lifetime totals (null until analytics are on) and site visits. */
  stats: { views: number | null; avgViewPercent: number | null; subscribersGained: number | null; pageViews: number };
  /** Same content on the other platform, if found. */
  twin: { id: string; label: string; hasPrompt: boolean } | null;
}

export function kindLabel(v: Pick<VideoRowData, "platform" | "format">): string {
  if (v.platform === "YOUTUBE") return v.format === "SHORT" ? "YouTube Short" : "YouTube video";
  return v.format === "REEL" ? "Instagram Reel" : "Instagram post";
}
