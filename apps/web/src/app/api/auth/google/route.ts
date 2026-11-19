import { NextResponse } from "next/server";
import { b64url } from "@/lib/session";
import { botBaseUrl } from "@/lib/comment-bot";

export const dynamic = "force-dynamic";

/** Start "Sign in with Google". Uses the same Google OAuth client as the YouTube connection. */
export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return NextResponse.redirect(new URL("/login?error=setup", request.url));
  const next = new URL(request.url).searchParams.get("next") ?? "/videos";
  const state = b64url(crypto.getRandomValues(new Uint8Array(24)));
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${botBaseUrl(request)}/api/auth/callback`,
    response_type: "code",
    scope: "openid email",
    prompt: "select_account",
    state,
  }).toString();
  const res = NextResponse.redirect(url);
  const cookieOpts = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/api/auth", maxAge: 600 };
  res.cookies.set("yaos_oauth_state", state, cookieOpts);
  res.cookies.set("yaos_oauth_next", next.startsWith("/") && !next.startsWith("//") ? next : "/videos", cookieOpts);
  return res;
}
