import { after, NextResponse } from "next/server";
import { handleInstagramComments, parseInstagramWebhook, safeEqual, verifyMetaSignature } from "@yaos/comment-bot";

export const dynamic = "force-dynamic";

/** Meta's one-time check when you save the webhook URL in the app dashboard. */
export async function GET(request: Request) {
  const p = new URL(request.url).searchParams;
  const verifyToken = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN;
  if (p.get("hub.mode") === "subscribe" && safeEqual(p.get("hub.verify_token"), verifyToken)) {
    return new Response(p.get("hub.challenge") ?? "", { status: 200, headers: { "content-type": "text/plain" } });
  }
  return new Response("Forbidden", { status: 403 });
}

/** Comment events. Answer 200 straight away (Meta retries slow webhooks) and reply in the background. */
export async function POST(request: Request) {
  const appSecret = process.env.INSTAGRAM_APP_SECRET;
  const raw = await request.text();
  if (!appSecret || !verifyMetaSignature(raw, request.headers.get("x-hub-signature-256"), appSecret)) {
    return new Response("Bad signature", { status: 401 });
  }
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }
  const events = parseInstagramWebhook(body);
  if (events.length) {
    after(async () => {
      try {
        console.log("[comment-bot] instagram", JSON.stringify(await handleInstagramComments(events)));
      } catch (error) {
        // Failures are recorded per comment and retried by the scheduled run.
        console.error("[comment-bot] instagram webhook failed", error);
      }
    });
  }
  return NextResponse.json({ received: events.length });
}
