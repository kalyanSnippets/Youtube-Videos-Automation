"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Polls the current route while mounted, so a page picks up a background agent's result (see
 * lib/actions/*.ts's use of after()) without the user manually reloading. Drop it inside a
 * "still working" empty state - it naturally stops once the parent re-renders with real content
 * and this component unmounts.
 */
export function AutoRefresh({ intervalMs = 4000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);
  return null;
}
