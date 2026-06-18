"use client";

import { useEffect, useState } from "react";

interface CountdownResult {
  display: string;
  expired: boolean;
  remainingSeconds: number;
}

/**
 * Countdown hook for expiry timestamps.
 * Consolidates the duplicate useCountdown / useSlotCountdown hooks
 * that were previously copy-pasted across payment, balance, and queue pages.
 */
export function useCountdown(expiresAt: string | null): CountdownResult {
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    expiresAt
      ? Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
      : 0
  );

  useEffect(() => {
    if (!expiresAt) return;
    const deadline = new Date(expiresAt).getTime();

    function tick() {
      const diff = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
      setRemainingSeconds(diff);
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const display = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  return {
    display,
    expired: remainingSeconds <= 0 && expiresAt !== null,
    remainingSeconds,
  };
}
