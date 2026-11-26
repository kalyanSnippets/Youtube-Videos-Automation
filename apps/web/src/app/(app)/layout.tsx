import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { NavSidebar } from "@/components/nav-sidebar";
import { Topbar } from "@/components/topbar";
import { MobileNav } from "@/components/mobile-nav";
import { InstallApp } from "@/components/install-app";

// Every page under this layout reads live, per-request DB state (dashboard counts, project
// lists, the owner user) — none of it is safe to prerender at build time, and forcing it here
// (rather than per-page) also stops the build from needing DB access at all.
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { default: "AI with Kalyan OS", template: "%s · AI with Kalyan OS" },
  // Installable as a phone app from these pages only (see app/app.webmanifest).
  manifest: "/app.webmanifest",
  appleWebApp: { capable: true, title: "Kalyan OS", statusBarStyle: "black" },
  icons: { icon: "/api/logo", apple: "/api/app-icon/180" },
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="md:flex md:h-screen md:overflow-hidden">
      <NavSidebar />
      <MobileNav />
      <div className="flex-1 flex flex-col md:overflow-hidden min-w-0">
        <Topbar user={user} />
        <InstallApp />
        {/* On phones the page scrolls normally and leaves room for the bottom tab bar. */}
        <main className="flex-1 md:overflow-y-auto pb-24 md:pb-0">{children}</main>
      </div>
    </div>
  );
}
