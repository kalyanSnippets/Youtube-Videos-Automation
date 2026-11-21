/** Small, shared formatting for video details on the public site and in the admin area. */

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

export interface VideoDetailSource {
  platform: string;
  format: string | null;
  publishedAt: Date | string | null;
  durationSeconds: number | null;
  views: number | null;
}

export function videoKind(v: Pick<VideoDetailSource, "platform" | "format">): string {
  if (v.platform === "YOUTUBE") return v.format === "SHORT" ? "YouTube Short" : "YouTube video";
  return v.format === "REEL" ? "Instagram Reel" : "Instagram post";
}

/** 75 -> "1:15", 3725 -> "1:02:05". */
export function formatDuration(seconds: number | null | undefined): string | null {
  if (!seconds || seconds <= 0) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const mm = h ? String(m).padStart(2, "0") : String(m);
  return `${h ? `${h}:` : ""}${mm}:${String(s).padStart(2, "0")}`;
}

export function formatDate(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" });
}

/** Date, length and views, for a one-line "details" row. Missing values are left out. */
export function videoDetailParts(v: VideoDetailSource): string[] {
  return [
    formatDate(v.publishedAt),
    formatDuration(v.durationSeconds),
    v.views !== null && v.views !== undefined ? `${compact.format(v.views)} views` : null,
  ].filter((x): x is string => Boolean(x));
}

/**
 * A short, readable summary of a YouTube description or Instagram caption for a card:
 * the opening lines, without links, hashtag-only lines or timestamps.
 */
export function descriptionSummary(description: string | null | undefined, max = 220): string | null {
  if (!description) return null;
  const lines = description
    .split("\n")
    .map((l) => l.replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim())
    // A line that only introduced a link ("Get the prompt:") is empty once the link is gone.
    .filter((l) => l && !/:$/.test(l) && !/^(#\S+\s*)+$/.test(l) && !/^\d{1,2}:\d{2}/.test(l) && /[a-z]/i.test(l));
  const text = lines.join(" ").replace(/\s+#\S+/g, "").trim();
  if (!text) return null;
  return text.length > max ? `${text.slice(0, max).replace(/\s+\S*$/, "")}…` : text;
}
