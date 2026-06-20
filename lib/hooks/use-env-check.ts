"use client";

import { useEffect, useState } from "react";

export function useEnvCheck() {
  const [reachable, setReachable] = useState(true);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        // Use relative URL to go through Next.js proxy (same-origin, no CORS)
        const res = await fetch("/health", { signal: AbortSignal.timeout(5000) });
        if (!cancelled) {
          setReachable(res.ok);
          setChecking(false);
        }
      } catch {
        if (!cancelled) {
          setReachable(false);
          setChecking(false);
        }
      }
    }

    check();
    const id = setInterval(check, 30000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return { reachable, checking };
}
