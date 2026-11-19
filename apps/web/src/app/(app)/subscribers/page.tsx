import { desc } from "drizzle-orm";
import { db, schema } from "@yaos/database";
import { formatRelativeTime } from "@/lib/utils";

export default async function SubscribersPage() {
  const rows = await db.select().from(schema.newsletterSubscribers).orderBy(desc(schema.newsletterSubscribers.createdAt)).limit(500);
  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-4xl">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px]">
          <h1 className="text-xl font-semibold mb-1">Subscribers</h1>
          <p className="text-sm text-text-dim">People who signed up for new prompts on your site. Download the CSV to import into any email tool.</p>
        </div>
        <a href="/api/admin/subscribers" className="rounded-lg bg-accent-cyan text-bg font-medium text-sm px-3.5 py-2">Download CSV</a>
      </div>
      <div className="panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-text-dim border-b border-border-subtle">
              <th className="p-3 font-medium">Email</th>
              <th className="p-3 font-medium">Signed up on</th>
              <th className="p-3 font-medium">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="p-3">{r.email}</td>
                <td className="p-3 text-text-dim">{r.source === "home" || !r.source ? "Home page" : `/r/${r.source}`}</td>
                <td className="p-3 text-text-dim">{formatRelativeTime(r.createdAt)}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={3} className="p-8 text-center text-text-dim">No subscribers yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
