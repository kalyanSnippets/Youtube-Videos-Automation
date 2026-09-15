import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getProjectSummaries } from "@/lib/project-data";
import { ProjectCard } from "@/components/dashboard/project-card";
import { cn } from "@/lib/utils";

const FILTERS = [
  { key: "active", label: "Active" },
  { key: "waiting", label: "Waiting for Me" },
  { key: "rendering", label: "Rendering" },
  { key: "blocked", label: "Blocked" },
  { key: "published", label: "Published" },
  { key: "archived", label: "Archived" },
] as const;

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter = "active" } = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null;

  const includeArchived = filter === "archived";
  const allProjects = await getProjectSummaries(user.workspaceId, includeArchived);

  const filtered = allProjects.filter((p) => {
    switch (filter) {
      case "waiting":
        return p.requiresApproval;
      case "rendering":
        return p.currentStage === "EDIT_PLAN_READY" || p.currentStage === "ROUGH_RENDERED";
      case "blocked":
        return p.isBlocked;
      case "published":
        return p.currentStage === "PUBLISHED" || p.currentStage === "ANALYTICS_REVIEWED";
      case "archived":
        return true;
      default:
        return true;
    }
  });

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Projects</h1>
        <Link href="/projects/new" className="text-sm text-accent-cyan hover:underline">
          + Start New Video
        </Link>
      </div>

      <div className="flex items-center gap-1 border-b border-border">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/projects?filter=${f.key}`}
            className={cn(
              "px-3.5 py-2 text-sm border-b-2 -mb-px transition",
              filter === f.key ? "border-accent-cyan text-text" : "border-transparent text-text-dim hover:text-text",
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="panel p-10 text-center text-text-dim text-sm">No projects match this filter.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
