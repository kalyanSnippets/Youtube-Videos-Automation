"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-accent-cyan to-accent-purple" />
          <span className="text-lg font-semibold">YouTube Agent OS</span>
        </div>
        <div className="panel p-6 text-left space-y-3">
          <div className="badge bg-status-danger/10 text-status-danger border border-status-danger/30">
            Server error
          </div>
          <p className="text-sm text-text-dim">
            The most common cause on a fresh deploy is <code className="text-text">DATABASE_URL</code> missing or
            pointing at an unreachable database. Check your host&apos;s environment variables, confirm the Postgres
            instance is reachable, and that <code className="text-text">pnpm db:migrate</code> has been run against
            it (see <code className="text-text">docs/DEPLOYMENT.md</code>), then redeploy.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="w-full rounded-lg bg-accent-cyan text-bg font-medium text-sm py-2 hover:brightness-110 transition"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
