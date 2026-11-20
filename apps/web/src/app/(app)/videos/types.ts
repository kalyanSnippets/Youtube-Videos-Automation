export interface VideoRowData {
  id: string;
  platform: string;
  format: string | null;
  title: string;
  watchUrl: string;
  publishedAt: string | null;
  slug: string;
  hidden: boolean;
  keyword: string | null;
  resourceTitle: string | null;
  prompt: string | null;
  promptSource: string | null;
  promptFilename: string | null;
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
