"use client";

import { useEffect } from "react";

/** Tells the server about one page visit, after the page has shown (never slows it down). */
export function ViewPing({ slug }: { slug: string }) {
  useEffect(() => {
    const url = `/v/${slug}/view`;
    if (!navigator.sendBeacon?.(url)) fetch(url, { method: "POST", keepalive: true }).catch(() => undefined);
  }, [slug]);
  return null;
}
