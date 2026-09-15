"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FolderKanban, Lightbulb, Bot, Clapperboard, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/idea-lab", label: "Idea Lab", icon: Lightbulb },
  { href: "/agent-runs", label: "Agent Runs", icon: Bot },
  { href: "/motion-templates", label: "Motion Templates", icon: Clapperboard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function NavSidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-60 shrink-0 border-r border-border bg-bg-panel flex flex-col">
      <div className="h-16 flex items-center gap-2 px-5 border-b border-border">
        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-accent-cyan to-accent-purple" />
        <span className="font-semibold text-sm">YouTube Agent OS</span>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition",
                active ? "bg-bg-raised text-text border border-border" : "text-text-dim hover:text-text hover:bg-bg-raised/60",
              )}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
