import { NextResponse } from "next/server";
import { safeEqual } from "@yaos/comment-bot";
import { appSecret, sessionEmailFromRequest } from "./session";

/** Public base URL used in OAuth redirect URIs. Netlify sets URL to the site's main address. */
export function botBaseUrl(request: Request): string {
  const configured = process.env.SITE_URL ?? process.env.URL;
  return (configured ?? new URL(request.url).origin).replace(/\/$/, "");
}

/** Signed-in owner (browser), or `Authorization: Bearer <APP_SECRET>` (the scheduled job). */
export async function isAuthorised(request: Request): Promise<boolean> {
  if (await sessionEmailFromRequest(request)) return true;
  const secret = appSecret();
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return Boolean(secret) && safeEqual(bearer, secret);
}

export function notAuthorised(): NextResponse {
  return NextResponse.json(
    { error: appSecret() ? "Sign in first (or send the APP_SECRET bearer token)." : "Set APP_SECRET (16+ characters) in the site's environment variables first." },
    { status: 401 },
  );
}

export function resultPage(title: string, body: string, ok: boolean): Response {
  const colour = ok ? "#22c55e" : "#ef4444";
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
  return new Response(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<body style="font-family:system-ui;background:#0b0d12;color:#e5e7eb;display:grid;place-items:center;min-height:100vh;margin:0;padding:16px">
<div style="max-width:520px;border:1px solid #262a33;border-radius:16px;padding:28px;background:#12151c">
<h1 style="margin:0 0 12px;font-size:20px;color:${colour}">${esc(title)}</h1><p style="line-height:1.5">${esc(body)}</p>
<p><a style="color:#22d3ee" href="/comment-bot">Open the Comment Bot page</a></p></div></body>`,
    { status: ok ? 200 : 400, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}
