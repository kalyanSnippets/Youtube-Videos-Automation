import Link from "next/link";
import { Plus } from "lucide-react";
import type { CurrentUser } from "@/lib/auth";

export function Topbar({ user }: { user: CurrentUser }) {
  return (
    <header className="hidden md:flex h-16 border-b border-border bg-bg-panel items-center justify-between px-6 shrink-0">
      <div />
      <div className="flex items-center gap-3">
        <Link
          href="/projects/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent-cyan text-bg font-medium text-sm px-3.5 py-2 hover:brightness-110 transition"
        >
          <Plus size={15} />
          Start New Video
        </Link>
        <a href="/" target="_blank" className="text-sm text-text-dim hover:text-text">View site ↗</a>
        <form action="/api/auth/logout" method="post">
          <button className="text-sm text-text-dim hover:text-text">Sign out</button>
        </form>
      </div>
    </header>
  );
}
