"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/comment-bot", label: "Activity" },
  { href: "/comment-bot/test", label: "Test a reply" },
  { href: "/comment-bot/templates", label: "Reply messages" },
  { href: "/comment-bot/setup", label: "Setup" },
];

export function BotTabs() {
  const path = usePathname();
  return (
    <nav className="flex gap-1 border-b border-border overflow-x-auto">
      {TABS.map((t) => {
        const active = path === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`whitespace-nowrap px-4 py-2.5 text-sm border-b-2 -mb-px transition ${
              active ? "border-accent-cyan text-text font-medium" : "border-transparent text-text-dim hover:text-text"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
