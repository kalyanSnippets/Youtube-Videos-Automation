import { desc } from "drizzle-orm";
import { db, schema } from "@yaos/database";
import { sessionEmailFromRequest } from "@/lib/session";

export const dynamic = "force-dynamic";

/** CSV download of newsletter signups (owner only). Import it into Mailchimp, Beehiiv, ConvertKit, etc. */
export async function GET(request: Request) {
  if (!(await sessionEmailFromRequest(request))) return new Response("Sign in required", { status: 401 });
  const rows = await db.select().from(schema.newsletterSubscribers).orderBy(desc(schema.newsletterSubscribers.createdAt));
  const cell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const csv = ["email,source,signed_up_at", ...rows.map((r) => [r.email, r.source ?? "", r.createdAt.toISOString()].map(cell).join(","))].join("\n");
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
