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

  return (
    <ErrorBoundary>
      <StreamPlayer sessionId={sessionId} adbPort={adbPort} />
    </ErrorBoundary>
  );
}
