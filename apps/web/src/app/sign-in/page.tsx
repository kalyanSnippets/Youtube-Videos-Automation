import { isSupabaseConfigured } from "@/lib/supabase/server";
import { continueInDevMode, signInWithPassword } from "@/lib/actions/auth";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const supabaseReady = isSupabaseConfigured();

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-accent-cyan to-accent-purple" />
            <span className="text-lg font-semibold">YouTube Agent OS</span>
          </div>
          <p className="text-sm text-text-dim">Your video production control centre</p>
        </div>

        <div className="panel p-6">
          {supabaseReady ? (
            <form action={signInWithPassword} className="space-y-4">
              <div>
                <label className="block text-xs text-text-dim mb-1.5" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full rounded-lg bg-bg-raised border border-border px-3 py-2 text-sm outline-none focus:border-accent-cyan/50"
                />
              </div>
              <div>
                <label className="block text-xs text-text-dim mb-1.5" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full rounded-lg bg-bg-raised border border-border px-3 py-2 text-sm outline-none focus:border-accent-cyan/50"
                />
              </div>
              {error ? <p className="text-xs text-status-danger">{error}</p> : null}
              <button
                type="submit"
                className="w-full rounded-lg bg-accent-cyan text-bg font-medium text-sm py-2 hover:brightness-110 transition"
              >
                Sign in
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="badge bg-status-warning/10 text-status-warning border border-status-warning/30">
                Supabase Auth not connected
              </div>
              <p className="text-sm text-text-dim">
                This session is running in local single-owner dev mode. Connect Supabase in Settings → Integrations
                (via <code className="text-text">NEXT_PUBLIC_SUPABASE_URL</code> /{" "}
                <code className="text-text">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>) to enable real authentication.
              </p>
              <form action={continueInDevMode}>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-accent-cyan text-bg font-medium text-sm py-2 hover:brightness-110 transition"
                >
                  Continue as Dev Owner
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
