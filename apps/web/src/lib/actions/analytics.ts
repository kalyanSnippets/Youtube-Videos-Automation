"use server";

import { requireAdmin } from "@/lib/admin";
import { syncYouTubeAnalytics } from "@/lib/youtube-analytics";

/** "Refresh now" on the Analytics page. Returns a one-line result for the button. */
export async function refreshAnalytics(): Promise<string> {
  try {
    await requireAdmin();
    const r = await syncYouTubeAnalytics({ force: true });
    if ("error" in r) return r.error;
    if ("skipped" in r) return r.skipped;
    return `Updated ${r.updatedVideos} videos and ${r.days} days.`;
  } catch (error) {
    return (error as Error).message;
  }
}
