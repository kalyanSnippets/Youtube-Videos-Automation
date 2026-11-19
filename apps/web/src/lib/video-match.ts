/** Pairs the same piece of content across YouTube and Instagram (e.g. a Short and its Reel). Pure functions. */

export interface MatchableVideo {
  id: string;
  platform: string;
  title: string;
  description: string | null;
  publishedAt: Date | string | null;
}

/** "My video #shorts #ai 🔥" -> "My video 🔥" */
export function cleanTitle(title: string): string {
  return title.replace(/(^|\s)#[\p{L}\p{N}_]+/gu, " ").replace(/\s{2,}/g, " ").trim();
}

function words(text: string): Set<string> {
  return new Set(
    cleanTitle(text)
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2),
  );
}

function time(d: Date | string | null): number | null {
  if (!d) return null;
  const t = typeof d === "string" ? Date.parse(d) : d.getTime();
  return Number.isNaN(t) ? null : t;
}

/** Best match on the other platform: shared title/caption words, posted around the same time. */
export function findTwin<T extends MatchableVideo>(video: MatchableVideo, all: T[]): T | null {
  const others = all.filter((o) => o.platform !== video.platform);
  const a = words(`${video.title} ${video.description?.slice(0, 200) ?? ""}`);
  const ta = time(video.publishedAt);
  let best: { v: T; score: number } | null = null;
  for (const o of others) {
    const b = words(`${o.title} ${o.description?.slice(0, 200) ?? ""}`);
    const shared = [...a].filter((w) => b.has(w)).length;
    const overlap = shared / Math.max(1, Math.min(a.size, b.size));
    const tb = time(o.publishedAt);
    const days = ta !== null && tb !== null ? Math.abs(ta - tb) / 86_400_000 : 99;
    const score = overlap + (days <= 3 ? 0.25 : days <= 10 ? 0.1 : 0);
    if (!best || score > best.score) best = { v: o, score };
  }
  return best && best.score >= 0.5 ? best.v : null;
}
