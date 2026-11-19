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
    <nav className="scroll-row -mx-4 flex gap-1 overflow-x-auto border-b border-border px-4 sm:mx-0 sm:px-0">
      {TABS.map((t) => {
        const active = path === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`shrink-0 whitespace-nowrap px-3 sm:px-4 py-3 sm:py-2.5 text-sm border-b-2 -mb-px transition ${
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
