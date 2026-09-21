import { getCurrentUser } from "@/lib/auth";
import { NavSidebar } from "@/components/nav-sidebar";
import { Topbar } from "@/components/topbar";

// Every page under this layout reads live, per-request DB state (dashboard counts, project
// lists, the owner user) — none of it is safe to prerender at build time, and forcing it here
// (rather than per-page) also stops the build from needing DB access at all.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="flex h-screen overflow-hidden">
      <NavSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar user={user} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
