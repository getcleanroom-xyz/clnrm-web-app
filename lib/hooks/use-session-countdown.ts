"use client";

import { useEffect, useState } from "react";

interface SessionCountdown {
  display: string;
  isExpired: boolean;
  remainingSeconds: number;
  isWarning: boolean;
  isCritical: boolean;
}

export function useSessionCountdown(
  expiresAt: string | null
): SessionCountdown {
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
    isExpired: remainingSeconds <= 0 && expiresAt !== null,
    remainingSeconds,
    isWarning: remainingSeconds > 0 && remainingSeconds <= 300,
    isCritical: remainingSeconds > 0 && remainingSeconds <= 60,
  };
}
