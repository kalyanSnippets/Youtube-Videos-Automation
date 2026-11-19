"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FolderKanban, Lightbulb, Bot, Clapperboard, MessagesSquare, Settings, Mail, Film } from "lucide-react";
import { cn } from "@/lib/utils";

/** Grouped so the everyday creator tools are on top and the video-production studio is separate. */
export const NAV_GROUPS: { title: string; items: { href: string; label: string; icon: typeof Film }[] }[] = [
  {
    title: "Channel",
    items: [
      { href: "/videos", label: "Videos & prompts", icon: Film },
      { href: "/comment-bot", label: "Comment Bot", icon: MessagesSquare },
      { href: "/subscribers", label: "Subscribers", icon: Mail },
    ],
  },
  {
    title: "Studio",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/projects", label: "Projects", icon: FolderKanban },
      { href: "/idea-lab", label: "Idea Lab", icon: Lightbulb },
      { href: "/agent-runs", label: "Agent Runs", icon: Bot },
      { href: "/motion-templates", label: "Motion Templates", icon: Clapperboard },
    ],
  },
  { title: "", items: [{ href: "/settings", label: "Settings", icon: Settings }] },
];

export function NavSidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex w-60 shrink-0 border-r border-border bg-bg-panel flex-col">
      <div className="h-16 flex items-center gap-2 px-5 border-b border-border">
        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-accent-cyan to-accent-purple" />
        <span className="font-semibold text-sm">YouTube Agent OS</span>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-5 overflow-y-auto">
        {NAV_GROUPS.map((group, i) => (
          <div key={group.title || i} className="space-y-1">
            {group.title && <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-text-faint">{group.title}</p>}
            {group.items.map((item) => {
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
          </div>
        ))}
      </nav>
    </aside>
  );
}
