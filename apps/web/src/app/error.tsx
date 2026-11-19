"use client";

import { useEffect } from "react";

/**
 * Shown when a page or a button action crashes. Explains the likely cause in plain words
 * and gives the reference code (digest) that matches the entry in Netlify's function logs.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  const message = error?.message ?? "";
  const outdated = /server action|failed to find|older or newer deployment|unexpected response|chunk/i.test(message);
  const database = /database|ECONN|ENOTFOUND|password authentication|relation .* does not exist|column .* does not exist/i.test(message);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-accent-cyan to-accent-purple" />
          <span className="text-lg font-semibold">AI with Kalyan</span>
        </div>
        <div className="panel p-6 text-left space-y-3">
          <div className="badge bg-status-danger/10 text-status-danger border border-status-danger/30">Something went wrong</div>
          {outdated ? (
            <p className="text-sm text-text-dim">
              The site was updated while this page was open, so the page is out of date. Reload the page and try again. Your work was not saved.
            </p>
          ) : database ? (
            <p className="text-sm text-text-dim">
              The site couldn&apos;t reach its database. Check <code className="text-text">DATABASE_URL</code> in Netlify&apos;s environment variables, then redeploy.
            </p>
          ) : (
            <p className="text-sm text-text-dim">
              Reload the page and try again. If it keeps happening, send the reference below. It matches the error in Netlify → Logs → Functions.
            </p>
          )}
          {message && !/omitted in production/i.test(message) && <p className="text-xs text-text-faint break-words">Details: {message.slice(0, 300)}</p>}
          {error?.digest && <p className="text-xs text-text-faint">Reference: {error.digest}</p>}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg bg-accent-cyan text-bg font-medium text-sm py-2 hover:brightness-110 transition"
            >
              Reload page
            </button>
            <button type="button" onClick={() => reset()} className="rounded-lg border border-border text-sm py-2 text-text-dim hover:text-text">
              Try again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
