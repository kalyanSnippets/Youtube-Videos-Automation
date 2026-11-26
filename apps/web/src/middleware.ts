import { NextResponse, type NextRequest } from "next/server";
import { appSecret, createSessionToken, SESSION_COOKIE, SESSION_DAYS, sessionExpiry, verifySessionToken } from "@/lib/session";

/**
 * Everything is private (owner only) except the public resources site and the endpoints that
 * Google, Meta and the scheduler call. Anything not listed here requires a signed-in owner.
 */
const PUBLIC_EXACT = new Set(["/", "/privacy", "/login", "/robots.txt", "/sitemap.xml", "/favicon.ico", "/icon.svg", "/app.webmanifest", "/sw.js"]);
const PUBLIC_PREFIXES = [
  "/r/", // resource pages
  "/v/", // video pages
  "/api/auth/", // sign-in flow
  "/api/newsletter", // public signup form
  "/api/comment-bot/instagram/webhook", // Meta (checks its own signature)
  "/api/comment-bot/run", // scheduler (checks APP_SECRET bearer)
  "/api/videos/sync", // scheduler (checks APP_SECRET bearer)
  "/api/thumb/", // video thumbnails (public images)
  "/api/logo", // site logo / browser tab icon
  "/api/app-icon/", // phone app icons
  "/_next/",
];

function isPublic(pathname: string): boolean {
  return PUBLIC_EXACT.has(pathname) || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

/** "www.aiwithkalyan.com" and "aiwithkalyan.com" count as the same site. */
function bareHost(host: string): string {
  return host.toLowerCase().replace(/^www\./, "");
}

/**
 * Pages are always served from the site's main address (SITE_URL, else Netlify's URL). Otherwise
 * opening a deploy snapshot link (abc123--site.netlify.app) or the old netlify.app address breaks
 * sign-in: the browser keeps sign-in cookies per address, and Google always returns to the main one.
 * Webhooks, scheduled jobs and other APIs are never redirected.
 */
function canonicalRedirect(request: NextRequest): NextResponse | null {
  const main = process.env.SITE_URL ?? process.env.URL;
  if (!main || (request.method !== "GET" && request.method !== "HEAD")) return null;
  const { pathname, search } = request.nextUrl;
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth/google")) return null;
  let target: URL;
  try {
    target = new URL(main);
  } catch {
    return null;
  }
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? request.nextUrl.host;
  if (!host || /^(localhost|127\.0\.0\.1|\[::1\])(:|$)/.test(host)) return null;
  if (bareHost(host) === bareHost(target.host)) return null;
  return NextResponse.redirect(new URL(pathname + search, target.origin), 308);
}

export async function middleware(request: NextRequest) {
  const redirect = canonicalRedirect(request);
  if (redirect) return redirect;
  const { pathname, search } = request.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const email = await verifySessionToken(token);
  if (email) {
    const res = NextResponse.next();
    // Keep the phone app signed in: while you keep using it, the 30 days restart (at most once a day).
    const exp = sessionExpiry(token);
    const secret = appSecret();
    if (secret && exp && !pathname.startsWith("/api/") && exp - Date.now() < (SESSION_DAYS - 1) * 86_400_000) {
      res.cookies.set(SESSION_COOKIE, await createSessionToken(email, secret), {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_DAYS * 86_400,
      });
    }
    return res;
  }
  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const login = new URL("/login", request.url);
  login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  // Skip static files (anything with an extension) for speed; they hold nothing private.
  matcher: ["/((?!_next/static|_next/image|.*\\.[a-zA-Z0-9]+$).*)"],
};
