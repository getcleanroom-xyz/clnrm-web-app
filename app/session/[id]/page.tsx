"use client";

import { useState, use } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { StreamPlayer } from "@/components/stream-player";

export default function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: sessionId } = use(params);
  const [adbPort] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = sessionStorage.getItem(`adb_${sessionId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.adb_port ?? null;
      }
    } catch {}
    return null;
  });

  const [sessionToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return sessionStorage.getItem(`session_token_${sessionId}`);
    } catch {}
    return null;
  });

  return (
    <ErrorBoundary>
      <StreamPlayer sessionId={sessionId} adbPort={adbPort} token={sessionToken} />
    </ErrorBoundary>
  );
}
