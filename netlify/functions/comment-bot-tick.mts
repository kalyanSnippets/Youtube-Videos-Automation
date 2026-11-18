/**
 * Netlify scheduled function: once a minute, ask the web app to poll YouTube comments,
 * retry failed Instagram replies and refresh tokens. Scheduled functions only run on the
 * published production deploy. Needs COMMENT_BOT_SECRET set on the site.
 */
export default async function commentBotTick(): Promise<Response> {
  const base = process.env.COMMENT_BOT_BASE_URL ?? process.env.URL;
  const secret = process.env.COMMENT_BOT_SECRET;
  if (!base || !secret) {
    console.log("[comment-bot] tick skipped: URL or COMMENT_BOT_SECRET missing");
    return new Response("not configured", { status: 200 });
  }
  const response = await fetch(`${base.replace(/\/$/, "")}/api/comment-bot/run`, {
    method: "POST",
    headers: { authorization: `Bearer ${secret}` },
  });
  console.log("[comment-bot] tick", response.status, (await response.text()).slice(0, 1000));
  return new Response("ok");
}

export const config = { schedule: "* * * * *" };
