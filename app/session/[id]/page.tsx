"use client";

import { useEffect, useState, use } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { StreamPlayer } from "@/components/stream-player";

export default function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: sessionId } = use(params);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(`session_token_${sessionId}`);
      if (stored) { setSessionToken(stored); return; }
    } catch {}
    try {
      const stored = localStorage.getItem("clnrm_token");
      if (stored) setSessionToken(stored);
    } catch {}
  }, [sessionId]);

  return (
    <ErrorBoundary>
      <StreamPlayer sessionId={sessionId} token={sessionToken} />
    </ErrorBoundary>
  );
}
