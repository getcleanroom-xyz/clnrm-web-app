"use client";

import { useState } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { StreamPlayer } from "@/components/session/stream-player";

function getSessionToken(sessionId: string): string | null {
  // Try session-specific key first (stored by queue/payment pages)
  try {
    const stored = sessionStorage.getItem(`session_token_${sessionId}`);
    if (stored) {
      // Also persist to localStorage so token survives tab close/reopen
      try { localStorage.setItem(`session_token_${sessionId}`, stored); } catch {}
      return stored;
    }
  } catch {}
  // Fall back to localStorage (survives tab close)
  try {
    const stored = localStorage.getItem(`session_token_${sessionId}`);
    if (stored) return stored;
  } catch {}
  return null;
}

export default function SessionClient({ sessionId }: { sessionId: string }) {
  const [sessionToken] = useState(() => getSessionToken(sessionId));

  return (
    <ErrorBoundary>
      <StreamPlayer sessionId={sessionId} token={sessionToken} />
    </ErrorBoundary>
  );
}
