"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Film, Mail, Menu, MessagesSquare, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_GROUPS } from "./nav-sidebar";

const TABS = [
  { href: "/videos", label: "Videos", icon: Film },
  { href: "/comment-bot", label: "Comments", icon: MessagesSquare },
  { href: "/subscribers", label: "Subscribers", icon: Mail },
];

/** Phones only: a slim top bar, a bottom tab bar for everyday tools, and a full menu in a drawer. */
export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <header className="md:hidden sticky top-0 z-30 h-14 flex items-center justify-between gap-3 border-b border-border bg-bg-panel/95 backdrop-blur px-4">
        <Link href="/videos" className="flex items-center gap-2">
          <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-accent-cyan to-accent-purple" />
          <span className="font-semibold text-sm">AI with Kalyan</span>
        </Link>
        <a href="/" target="_blank" className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-dim">View site ↗</a>
      </header>

      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-bg-panel/95 backdrop-blur grid grid-cols-4"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn("flex flex-col items-center justify-center gap-1 py-2.5 text-[11px]", isActive(t.href) ? "text-accent-cyan" : "text-text-dim")}
            >
              <Icon size={20} />
              {t.label}
            </Link>
          );
        })}
        <button onClick={() => setOpen(true)} className={cn("flex flex-col items-center justify-center gap-1 py-2.5 text-[11px]", open ? "text-accent-cyan" : "text-text-dim")}>
          <Menu size={20} />
          Menu
        </button>
      </nav>

      {open && (
        <div className="md:hidden fixed inset-0 z-40">
          <button aria-label="Close menu" onClick={() => setOpen(false)} className="absolute inset-0 bg-black/60" />
          <div className="absolute bottom-0 inset-x-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-border bg-bg-panel p-4 space-y-5" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
            <div className="flex items-center justify-between">
              <p className="font-semibold">Menu</p>
              <button onClick={() => setOpen(false)} aria-label="Close" className="rounded-lg p-2 text-text-dim">
                <X size={20} />
              </button>
            </div>
            {NAV_GROUPS.map((group, i) => (
              <div key={group.title || i} className="space-y-1">
                {group.title && <p className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wider text-text-faint">{group.title}</p>}
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-3 text-base",
                        isActive(item.href) ? "bg-bg-raised text-text border border-border" : "text-text-dim",
                      )}
                    >
                      <Icon size={18} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ))}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link href="/projects/new" className="rounded-xl bg-accent-cyan text-bg text-center font-medium py-3 text-sm">+ New video project</Link>
              <form action="/api/auth/logout" method="post">
                <button className="w-full rounded-xl border border-border py-3 text-sm text-text-dim">Sign out</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
