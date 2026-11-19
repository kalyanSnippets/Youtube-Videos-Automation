/**
 * Netlify scheduled function: once an hour, refresh the Videos list from YouTube and Instagram.
 * Scheduled functions only run on the production deploy. Needs APP_SECRET set on the site.
 */
export default async function videosSync(): Promise<Response> {
  const base = process.env.SITE_URL ?? process.env.URL;
  const secret = process.env.APP_SECRET;
  if (!base || !secret) {
    console.log("[videos] sync skipped: URL or APP_SECRET missing");
    return new Response("not configured", { status: 200 });
  }
  const response = await fetch(`${base.replace(/\/$/, "")}/api/videos/sync`, {
    method: "POST",
    headers: { authorization: `Bearer ${secret}` },
  });
  console.log("[videos] sync", response.status, (await response.text()).slice(0, 1000));
  return new Response("ok");
}

export const config = { schedule: "0 * * * *" };
