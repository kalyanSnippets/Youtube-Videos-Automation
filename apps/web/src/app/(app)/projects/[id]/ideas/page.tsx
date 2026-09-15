import { eq, desc } from "drizzle-orm";
import { db, schema } from "@yaos/database";
import { rerunIdeaResearch, selectIdeaAction } from "@/lib/actions/ideas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function IdeasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ideas = await db
    .select()
    .from(schema.videoIdeas)
    .where(eq(schema.videoIdeas.projectId, id))
    .orderBy(desc(schema.videoIdeas.overallScore));

  async function rerun() {
    "use server";
    await rerunIdeaResearch(id);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Idea Lab Results</h2>
          <p className="text-sm text-text-dim">Ranked candidates for this project. Select one to move forward.</p>
        </div>
        <form action={rerun}>
          <Button type="submit" variant="secondary">
            Re-run Idea Research
          </Button>
        </form>
      </div>

      {ideas.length === 0 ? (
        <div className="panel p-10 text-center text-text-dim text-sm">No ideas generated yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} projectId={id} />
          ))}
        </div>
      )}
    </div>
  );
}

function IdeaCard({ idea, projectId }: { idea: typeof schema.videoIdeas.$inferSelect; projectId: string }) {
  async function select() {
    "use server";
    await selectIdeaAction(projectId, idea.id);
  }

  return (
    <div className={`panel p-5 space-y-3 ${idea.isSelected ? "border-accent-cyan/60" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium text-sm">{idea.workingTitle}</h3>
        <Badge variant="cyan">{idea.overallScore}/100</Badge>
      </div>
      <p className="text-sm text-text-dim italic">&ldquo;{idea.hook}&rdquo;</p>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <Stat label="Trend" value={idea.trendScore} />
        <Stat label="Evergreen" value={idea.evergreenScore} />
        <Stat label="Click" value={idea.clickPotential} />
        <Stat label="Evidence" value={idea.evidenceStrength} />
        <Stat label="Novelty" value={idea.novelty} />
        <Stat label="Difficulty" value={idea.productionDifficulty} />
      </div>

      {idea.referenceCreator ? <p className="text-xs text-text-faint">Reference: {idea.referenceCreator}</p> : null}
      <p className="text-xs text-text-faint">{idea.whyNow}</p>

      {idea.isSelected ? (
        <Badge variant="success">Selected</Badge>
      ) : (
        <form action={select}>
          <Button type="submit" variant="secondary" className="w-full">
            Select this idea
          </Button>
        </form>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-bg-raised border border-border-subtle px-2 py-1.5 text-center">
      <p className="text-text-faint">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
