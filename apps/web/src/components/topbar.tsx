import Link from "next/link";
import { Plus } from "lucide-react";
import { getAllProviders } from "@yaos/ai-providers";
import { Badge } from "./ui/badge";
import type { CurrentUser } from "@/lib/auth";

export function Topbar({ user }: { user: CurrentUser }) {
  const anyRealProviderAvailable = getAllProviders().some((p) => p.id !== "MOCK" && p.isAvailable());

  return (
    <header className="h-16 border-b border-border bg-bg-panel flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3">
        {!anyRealProviderAvailable ? (
          <Badge variant="warning">MOCK MODE</Badge>
        ) : (
          <Badge variant="success">LIVE PROVIDERS CONNECTED</Badge>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/projects/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent-cyan text-bg font-medium text-sm px-3.5 py-2 hover:brightness-110 transition"
        >
          <Plus size={15} />
          Start New Video
        </Link>
        <div className="text-sm text-text-dim">{user.email}</div>
      </div>
    </header>
  );
}
