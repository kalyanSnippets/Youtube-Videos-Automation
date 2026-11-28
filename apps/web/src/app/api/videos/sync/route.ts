import { NextResponse } from "next/server";
import { isAuthorised, notAuthorised } from "@/lib/comment-bot";
import { runVideoSync } from "@/lib/video-sync";
import { refreshPublicSite } from "@/lib/public-data";

export const dynamic = "force-dynamic";

/** Called hourly by netlify/functions/videos-sync.mts (bearer APP_SECRET), or by a signed-in owner. */
async function run(request: Request) {
  if (!(await isAuthorised(request))) return notAuthorised();
  const report = await runVideoSync();
  // New videos, titles and view counts should show on the public site straight away.
  refreshPublicSite();
  console.log("[videos] sync", JSON.stringify(report));
  return NextResponse.json({ at: new Date().toISOString(), ...report });
}

export const GET = run;
export const POST = run;
