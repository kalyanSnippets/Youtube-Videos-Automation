/**
 * Owner sign-in session: a signed cookie "<base64url email>.<expiry ms>.<hmac>".
 * Uses Web Crypto only, so the same code runs in middleware (edge) and in route handlers (node).
 * Signed with APP_SECRET; only emails in ADMIN_EMAILS can ever get one (see /api/auth/callback).
 */
export const SESSION_COOKIE = "yaos_session";
export const SESSION_DAYS = 30;

const enc = new TextEncoder();

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = "";
  for (const b of arr) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): string {
  const pad = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  return new TextDecoder().decode(Uint8Array.from(atob(pad), (c) => c.charCodeAt(0)));
}

export function appSecret(): string | null {
  const s = process.env.APP_SECRET;
  return s && s.length >= 16 ? s : null;
}

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

async function hmac(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionToken(email: string, secret: string, now = Date.now()): Promise<string> {
  const payload = `${b64url(enc.encode(email.toLowerCase()))}.${now + SESSION_DAYS * 86_400_000}`;
  return `${payload}.${await hmac(payload, secret)}`;
}

/** Returns the signed-in email, or null. Also re-checks ADMIN_EMAILS so removing an email locks it out immediately. */
export async function verifySessionToken(token: string | undefined | null, secret: string | null = appSecret(), now = Date.now()): Promise<string | null> {
  if (!token || !secret) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [emailPart, exp, mac] = parts as [string, string, string];
  if (!(Number(exp) > now)) return null;
  if (!constantTimeEqual(mac, await hmac(`${emailPart}.${exp}`, secret))) return null;
  let email: string;
  try {
    email = fromB64url(emailPart);
  } catch {
    return null;
  }
  return adminEmails().includes(email) ? email : null;
}

/** Read the session from a Request's Cookie header (route handlers). */
export async function sessionEmailFromRequest(request: Request): Promise<string | null> {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  return verifySessionToken(match ? decodeURIComponent(match[1]!) : null);
}

export { b64url };
