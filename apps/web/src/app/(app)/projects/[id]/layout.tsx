import { getProjectDetail } from "@/lib/project-detail";
import { ProjectHeader } from "@/components/project/project-header";
import { ProjectTabs } from "@/components/project/project-tabs";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getProjectDetail(id);

  return (
    <div>
      <ProjectHeader detail={detail} />
      <ProjectTabs projectId={id} />
      <div className="p-4 sm:p-6 max-w-[1200px]">{children}</div>
    </div>
  );
}
