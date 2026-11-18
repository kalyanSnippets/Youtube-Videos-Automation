import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed OAuth `state` so only someone who knows COMMENT_BOT_SECRET can connect an account,
 * and a callback can't be replayed later. Format: <platform>.<unix-ms>.<hmac>.
 */
const MAX_AGE_MS = 15 * 60 * 1000;

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createOAuthState(platform: string, secret: string, now = Date.now()): string {
  const payload = `${platform}.${now}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyOAuthState(state: string | null, platform: string, secret: string, now = Date.now()): boolean {
  if (!state) return false;
  const parts = state.split(".");
  if (parts.length !== 3) return false;
  const [p, ts, mac] = parts as [string, string, string];
  if (p !== platform) return false;
  const age = now - Number(ts);
  if (!Number.isFinite(age) || age < 0 || age > MAX_AGE_MS) return false;
  const expected = sign(`${p}.${ts}`, secret);
  return mac.length === expected.length && timingSafeEqual(Buffer.from(mac), Buffer.from(expected));
}

export function safeEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}
