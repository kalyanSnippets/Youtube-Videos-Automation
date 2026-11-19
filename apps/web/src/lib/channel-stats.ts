import { desc } from "drizzle-orm";
import { db, schema } from "@yaos/database";

export interface PlatformStats {
  followers: number | null;
  posts: number | null;
  views: number | null;
  day: string;
  /** Change in followers over the last 7 days, when there's history to compare. */
  followersChange7d: number | null;
}

/** Latest subscriber/follower counts per platform, plus 7-day change. Empty if the table isn't there yet. */
export async function latestStats(): Promise<{ youtube: PlatformStats | null; instagram: PlatformStats | null }> {
  const rows = await db.select().from(schema.channelStats).orderBy(desc(schema.channelStats.day)).limit(60).catch(() => []);
  const pick = (platform: string): PlatformStats | null => {
    const list = rows.filter((r) => r.platform === platform);
    const latest = list[0];
    if (!latest) return null;
    const weekAgo = new Date(new Date(latest.day).getTime() - 7 * 86_400_000).toISOString().slice(0, 10);
    const older = list.find((r) => r.day <= weekAgo);
    return {
      followers: latest.followers,
      posts: latest.posts,
      views: latest.views,
      day: latest.day,
      followersChange7d: older && latest.followers !== null && older.followers !== null ? latest.followers - older.followers : null,
    };
  };
  return { youtube: pick("YOUTUBE"), instagram: pick("INSTAGRAM") };
}
