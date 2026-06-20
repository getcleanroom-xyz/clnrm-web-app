"use client";

import { useEffect, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.getcleanroom.xyz";

export function useEnvCheck() {
  const [reachable, setReachable] = useState(true);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(5000) });
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
