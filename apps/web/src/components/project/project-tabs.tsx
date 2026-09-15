"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "ideas", label: "Ideas" },
  { key: "references", label: "References" },
  { key: "claims", label: "Claims & Evidence" },
  { key: "methodology", label: "Methodology" },
  { key: "script", label: "Script" },
  { key: "production", label: "Production Script" },
  { key: "aroll", label: "A-Roll" },
  { key: "shot-list", label: "Shot List" },
  { key: "assets", label: "Assets" },
  { key: "transcript", label: "Transcript" },
  { key: "edit-plan", label: "Edit Plan" },
  { key: "qa", label: "QA" },
  { key: "render", label: "Render" },
  { key: "publish", label: "Publish" },
  { key: "analytics", label: "Analytics" },
  { key: "activity", label: "Activity" },
] as const;

export function ProjectTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  return (
    <div className="flex items-center gap-1 border-b border-border overflow-x-auto px-6 no-scrollbar">
      {TABS.map((tab) => {
        const href = `/projects/${projectId}/${tab.key}`;
        const active = pathname === href;
        return (
          <Link
            key={tab.key}
            href={href}
            className={cn(
              "px-3 py-2.5 text-sm whitespace-nowrap border-b-2 -mb-px transition",
              active ? "border-accent-cyan text-text" : "border-transparent text-text-dim hover:text-text",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
