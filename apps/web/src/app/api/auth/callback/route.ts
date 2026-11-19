import { NextResponse, type NextRequest } from "next/server";
import { adminEmails, appSecret, createSessionToken, SESSION_COOKIE, SESSION_DAYS } from "@/lib/session";
import { botBaseUrl } from "@/lib/comment-bot";

export const dynamic = "force-dynamic";

function fail(request: NextRequest, error: string) {
  return NextResponse.redirect(new URL(`/login?error=${error}`, request.url));
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const expectedState = request.cookies.get("yaos_oauth_state")?.value;
  if (!expectedState || params.get("state") !== expectedState) return fail(request, "expired");
  const code = params.get("code");
  const secret = appSecret();
  if (!code || !secret || !process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) return fail(request, "setup");

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${botBaseUrl(request)}/api/auth/callback`,
      grant_type: "authorization_code",
    }),
  });
  const token = (await tokenRes.json()) as { id_token?: string };
  if (!tokenRes.ok || !token.id_token) return fail(request, "google");

  // The id_token came straight from Google over TLS in exchange for our client secret, so its
  // claims can be read without re-verifying the signature (OpenID Connect Core 3.1.3.7).
  let claims: { email?: string; email_verified?: boolean; aud?: string };
  try {
    const payload = token.id_token.split(".")[1]!.replace(/-/g, "+").replace(/_/g, "/");
    claims = JSON.parse(atob(payload + "===".slice((payload.length + 3) % 4)));
  } catch {
    return fail(request, "google");
  }
  const email = claims.email?.toLowerCase();
  if (claims.aud !== process.env.GOOGLE_CLIENT_ID || !email || !claims.email_verified) return fail(request, "google");
  if (!adminEmails().includes(email)) return fail(request, "not-allowed");

  const next = request.cookies.get("yaos_oauth_next")?.value ?? "/videos";
  const res = NextResponse.redirect(new URL(next.startsWith("/") && !next.startsWith("//") ? next : "/videos", request.url));
  res.cookies.set(SESSION_COOKIE, await createSessionToken(email, secret), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86_400,
  });
  res.cookies.delete({ name: "yaos_oauth_state", path: "/api/auth" });
  res.cookies.delete({ name: "yaos_oauth_next", path: "/api/auth" });
  return res;
}
