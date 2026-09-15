import { eq } from "drizzle-orm";
import { db, schema } from "@yaos/database";
import { NotConnectedPanel } from "@/components/project/not-connected-panel";
import { Badge } from "@/components/ui/badge";

export default async function PublishPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [pkg] = await db.select().from(schema.publishPackages).where(eq(schema.publishPackages.projectId, id));

  if (!pkg) {
    return (
      <NotConnectedPanel
        title="No publish package yet"
        description="The Publishing Strategist generates titles, thumbnails, description, chapters, and sources once the final render is approved."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="panel p-5">
        <h3 className="text-sm font-semibold text-text-dim uppercase tracking-wide mb-3">Title Options</h3>
        <div className="space-y-2">
          {(pkg.titleOptions ?? []).map((t) => (
            <div key={t.title} className="flex items-center justify-between text-sm">
              <span className={t.title === pkg.selectedTitle ? "text-accent-cyan" : ""}>{t.title}</span>
              <Badge variant="cyan">{t.score}</Badge>
            </div>
          ))}
        </div>
      </div>
      <div className="panel p-5">
        <h3 className="text-sm font-semibold text-text-dim uppercase tracking-wide mb-2">Description</h3>
        <p className="text-sm text-text-dim whitespace-pre-wrap">{pkg.description}</p>
      </div>
    </div>
  );
}
