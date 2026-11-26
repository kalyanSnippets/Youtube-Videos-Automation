"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "kalyan-os-install-dismissed";

type Mode = "hidden" | "android" | "ios" | "manual";

/**
 * Offers to install the admin as a phone app. Android/Chrome gets a real Install button; iPhone
 * (Safari has no install button) gets the two taps to do it by hand. Hidden once installed.
 * `inline` is the always-visible version for Settings; otherwise it's a dismissible banner.
 */
export function InstallApp({ inline = false }: { inline?: boolean }) {
  const [mode, setMode] = useState<Mode>("hidden");
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);

    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
    if (standalone) {
      setInstalled(true);
      return;
    }
    let dismissed = false;
    try {
      dismissed = !inline && localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      // storage blocked: just show it
    }
    if (dismissed) return;

    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/.test(ua) || (ua.includes("Mac") && "ontouchend" in document);
    if (isIOS) setMode("ios");

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPromptEvent);
      setMode("android");
    };
    const onInstalled = () => {
      setInstalled(true);
      setMode("hidden");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    // Browsers without an install button of their own (Samsung Internet, Firefox): show the menu steps.
    const touch = window.matchMedia("(pointer: coarse)").matches;
    const fallback = !isIOS && touch ? window.setTimeout(() => setMode((m) => (m === "hidden" ? "manual" : m)), 4000) : undefined;
    return () => {
      window.clearTimeout(fallback);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [inline]);

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
    setMode("hidden");
  }

  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setPrompt(null);
    setMode("hidden");
  }

  if (inline) {
    return (
      <div className="text-sm space-y-2">
        {installed ? (
          <p className="text-status-success">✓ You&apos;re using the installed app.</p>
        ) : mode === "android" ? (
          <button onClick={install} className="inline-flex items-center gap-2 rounded-lg bg-accent-cyan text-bg font-medium px-4 py-2">
            <Download size={15} /> Install the app
          </button>
        ) : (
          <>
            <p className="text-text-dim">
              <span className="text-text font-medium">iPhone:</span> open this site in Safari, tap <Share size={13} className="inline -mt-0.5" /> Share, then{" "}
              <span className="text-text">Add to Home Screen</span>.
            </p>
            <p className="text-text-dim">
              <span className="text-text font-medium">Android:</span> open it in Chrome, tap the ⋮ menu, then <span className="text-text">Install app</span> (or Add to Home screen).
            </p>
          </>
        )}
      </div>
    );
  }

  if (mode === "hidden" || installed) return null;
  return (
    <div className="md:hidden mx-4 mt-3 flex items-start gap-3 rounded-xl border border-accent-cyan/30 bg-accent-cyan/5 p-3 text-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/api/app-icon/192" alt="" className="h-10 w-10 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="font-medium">Get AI with Kalyan OS on your phone</p>
        {mode === "android" ? (
          <button onClick={install} className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-accent-cyan text-bg font-medium px-3 py-1.5 text-xs">
            <Download size={13} /> Install app
          </button>
        ) : mode === "ios" ? (
          <p className="mt-0.5 text-xs text-text-dim">
            Tap <Share size={12} className="inline -mt-0.5" /> Share, then <span className="text-text">Add to Home Screen</span>.
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-text-dim">
            Open your browser menu (⋮), then <span className="text-text">Install app</span> or <span className="text-text">Add to Home screen</span>.
          </p>
        )}
      </div>
      <button onClick={dismiss} aria-label="Don't show again" className="p-1 text-text-faint hover:text-text">
        <X size={16} />
      </button>
    </div>
  );
}
