import { eq, desc, inArray } from "drizzle-orm";
import Link from "next/link";
import { db, schema } from "@yaos/database";
import { getCurrentUser } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";

export default async function IdeaLabPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const projects = await db.select().from(schema.projects).where(eq(schema.projects.workspaceId, user.workspaceId));
  const projectIds = projects.map((p) => p.id);
  const ideas =
    projectIds.length === 0
      ? []
      : await db.select().from(schema.videoIdeas).where(inArray(schema.videoIdeas.projectId, projectIds)).orderBy(desc(schema.videoIdeas.overallScore));

  const projectById = new Map(projects.map((p) => [p.id, p]));

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-[1400px]">
      <div>
        <h1 className="text-xl font-semibold mb-1">Idea Lab</h1>
        <p className="text-sm text-text-dim">Cross-project opportunity research, ranked by overall score.</p>
      </div>

      {ideas.length === 0 ? (
        <div className="panel p-10 text-center text-text-dim text-sm">No ideas researched yet across any project.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {ideas.map((idea) => {
            const project = projectById.get(idea.projectId);
            return (
              <Link key={idea.id} href={`/projects/${idea.projectId}/ideas`} className="panel p-4 space-y-2 hover:border-accent-cyan/40 transition">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{idea.workingTitle}</p>
                  <Badge variant="cyan">{idea.overallScore}</Badge>
                </div>
                <p className="text-xs text-text-dim italic">&ldquo;{idea.hook}&rdquo;</p>
                <div className="flex items-center justify-between text-xs text-text-faint">
                  <span>{project?.title}</span>
                  {idea.isSelected ? <Badge variant="success">Selected</Badge> : null}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
