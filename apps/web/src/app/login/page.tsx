import { redirect } from "next/navigation";
import { currentAdminEmail } from "@/lib/admin";
import { SiteLogo } from "@/components/site-logo";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Sign in",
  manifest: "/app.webmanifest",
  appleWebApp: { capable: true, title: "Kalyan OS", statusBarStyle: "black" as const },
  icons: { icon: "/api/logo", apple: "/api/app-icon/180" },
};

const ERRORS: Record<string, string> = {
  "not-allowed": "That Google account isn't allowed. Sign in with the email listed in ADMIN_EMAILS.",
  expired: "The sign-in couldn't be finished (it took too long, or was started from a different web address). Please try again from this page.",
  google: "Google didn't confirm the sign-in. Please try again.",
  setup: "Sign-in isn't set up yet: add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, APP_SECRET and ADMIN_EMAILS in Netlify, then redeploy.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  if (await currentAdminEmail()) redirect(next?.startsWith("/") ? next : "/videos");
  const href = `/api/auth/google${next ? `?next=${encodeURIComponent(next)}` : ""}`;
  return (
    <main className="min-h-screen grid place-items-center px-4">
      <div className="panel w-full max-w-sm p-8 space-y-5 text-center">
        <SiteLogo size={48} className="mx-auto rounded-xl" />
        <div>
          <h1 className="text-lg font-semibold">AI with Kalyan OS</h1>
          <p className="text-sm text-text-dim mt-1">This area is private. Viewers: the free resources are on the home page.</p>
        </div>
        {error && <p className="text-sm text-status-danger">{ERRORS[error] ?? "Sign-in failed."}</p>}
        <a href={href} className="flex items-center justify-center gap-2 rounded-lg bg-white text-black font-medium text-sm px-4 py-2.5 hover:brightness-95">
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
          Sign in with Google
        </a>
        <a href="/" className="block text-xs text-text-dim hover:text-text">← Back to resources</a>
      </div>
    </main>
  );
}
