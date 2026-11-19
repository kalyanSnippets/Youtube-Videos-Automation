import { NextResponse } from "next/server";
import { isAuthorised, notAuthorised } from "@/lib/comment-bot";
import { runVideoSync } from "@/lib/video-sync";

export const dynamic = "force-dynamic";

/** Called hourly by netlify/functions/videos-sync.mts (bearer APP_SECRET), or by a signed-in owner. */
async function run(request: Request) {
  if (!(await isAuthorised(request))) return notAuthorised();
  const report = await runVideoSync();
  console.log("[videos] sync", JSON.stringify(report));
  return NextResponse.json({ at: new Date().toISOString(), ...report });
}

export const GET = run;
export const POST = run;
