"use client";

import { useEffect, useState } from "react";
import type { FollowLinks } from "@/lib/site";

/**
 * "Subscribe & Follow" in as few taps as the platforms allow. Neither YouTube nor Instagram lets a
 * website subscribe/follow on a viewer's behalf, so:
 *   1. the button opens YouTube's own "Subscribe to …?" confirmation in a new tab;
 *   2. when the viewer comes back, an "Now follow on Instagram" button is waiting, highlighted.
 */
export function FollowCta({ links, size = "lg" }: { links: FollowLinks; size?: "sm" | "lg" }) {
  const [step, setStep] = useState<"start" | "instagram" | "done">("start");
  const [back, setBack] = useState(false);

  useEffect(() => {
    if (step !== "instagram") return;
    const onBack = () => document.visibilityState === "visible" && setBack(true);
    document.addEventListener("visibilitychange", onBack);
    window.addEventListener("focus", onBack);
    return () => {
      document.removeEventListener("visibilitychange", onBack);
      window.removeEventListener("focus", onBack);
    };
  }, [step]);

  if (!links.youtube && !links.instagram) return null;
  const big = size === "lg";
  const primary = `inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition ${big ? "px-5 py-3 text-sm" : "px-3.5 py-2 text-xs"}`;

  // Only one platform configured: a plain button for it.
  if (!links.youtube || !links.instagram) {
    const href = (links.youtube ?? links.instagram)!;
    return (
      <a href={href} target="_blank" rel="noopener" className={`${primary} bg-gradient-to-r from-accent-cyan to-accent-purple text-bg hover:brightness-110`}>
        {links.youtube ? "Subscribe on YouTube" : "Follow on Instagram"}
      </a>
    );
  }

  if (step === "done") {
    return <p className={`${big ? "text-sm" : "text-xs"} text-status-success`}>Thank you for subscribing and following! 🙌</p>;
  }

  if (step === "instagram") {
    return (
      <div className={`flex flex-wrap items-center gap-3 ${big ? "" : "text-xs"}`}>
        <a
          href={links.instagram}
          target="_blank"
          rel="noopener"
          onClick={() => setStep("done")}
          className={`${primary} bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white hover:brightness-110 ${back ? "ring-2 ring-offset-2 ring-offset-bg ring-[#dd2a7b] animate-pulse" : ""}`}
        >
          Step 2 of 2: Follow on Instagram
        </a>
        <span className="text-text-dim">{back ? "Almost done!" : "Subscribed on YouTube? Now one more tap."}</span>
      </div>
    );
  }

  return (
    <a
      href={links.youtube}
      target="_blank"
      rel="noopener"
      onClick={() => setStep("instagram")}
      className={`${primary} bg-gradient-to-r from-accent-cyan to-accent-purple text-bg hover:brightness-110`}
    >
      Subscribe & Follow
      <span className={`font-normal opacity-80 ${big ? "text-xs" : "text-[10px]"}`}>YouTube + Instagram</span>
    </a>
  );
}
