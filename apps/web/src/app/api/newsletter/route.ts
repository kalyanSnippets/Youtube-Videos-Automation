import { NextResponse } from "next/server";
import { db, schema } from "@yaos/database";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Public newsletter signup. Duplicate emails are accepted silently so the form never reveals who's subscribed. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: unknown; website?: unknown; source?: unknown };
  if (typeof body.website === "string" && body.website) return NextResponse.json({ ok: true }); // bot filled the honeypot
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email) || email.length > 320) return NextResponse.json({ error: "That email doesn't look right." }, { status: 400 });
  const source = typeof body.source === "string" ? body.source.slice(0, 120) : null;
  await db.insert(schema.newsletterSubscribers).values({ email, source }).onConflictDoNothing({ target: schema.newsletterSubscribers.email });
  return NextResponse.json({ ok: true });
}
