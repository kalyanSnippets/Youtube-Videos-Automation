"use client";

import { useState } from "react";

export function NewsletterForm({ source }: { source: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  return (
    <form
      className="panel p-5 sm:p-6 space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        setStatus("sending");
        const res = await fetch("/api/newsletter", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: form.get("email"), website: form.get("website"), source }),
        }).catch(() => null);
        const json = (await res?.json().catch(() => null)) as { error?: string } | null;
        if (res?.ok) setStatus("done");
        else {
          setStatus("error");
          setMessage(json?.error ?? "Something went wrong. Try again.");
        }
      }}
    >
      <div>
        <p className="font-semibold">Get new prompts by email</p>
        <p className="text-sm text-text-dim">Optional. One short email when I post something new. Unsubscribe any time.</p>
      </div>
      {status === "done" ? (
        <p className="text-sm text-status-success">You're in! 🎉</p>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            name="email"
            type="email"
            required
            placeholder="you@email.com"
            className="flex-1 min-w-0 rounded-lg bg-bg-raised border border-border px-3 py-2 text-sm focus:outline-none focus:border-accent-cyan/50"
          />
          {/* Honeypot: real people never see or fill this. */}
          <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
          <button disabled={status === "sending"} className="rounded-lg bg-accent-purple text-white font-medium text-sm px-4 py-2 disabled:opacity-50">
            {status === "sending" ? "Joining…" : "Join"}
          </button>
        </div>
      )}
      {status === "error" && <p className="text-sm text-status-danger">{message}</p>}
    </form>
  );
}
