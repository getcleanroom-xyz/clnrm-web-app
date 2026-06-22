"use client";

import { useEffect, useRef, useState } from "react";

interface SessionCountdown {
  display: string;
  isExpired: boolean;
  remainingSeconds: number;
  isWarning: boolean;
  isCritical: boolean;
}

export function useSessionCountdown(
  remainingSeconds: number | null
): SessionCountdown {
  const [seconds, setSeconds] = useState(() =>
    remainingSeconds !== null ? Math.max(0, remainingSeconds) : 0
  );
  const prevRemainingRef = useRef(remainingSeconds);

  useEffect(() => {
    if (remainingSeconds === null) return;

    // Sync from server value when it changes
    if (prevRemainingRef.current !== remainingSeconds) {
      prevRemainingRef.current = remainingSeconds;
      setSeconds(Math.max(0, remainingSeconds));
    }

    const id = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [remainingSeconds]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const display = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  return {
    display,
    isExpired: seconds <= 0 && remainingSeconds !== null,
    remainingSeconds: seconds,
    isWarning: seconds > 0 && seconds <= 300,
    isCritical: seconds > 0 && seconds <= 60,
  };
}
