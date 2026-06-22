"use client";

import { useState, useEffect } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { StreamPlayer } from "@/components/session/stream-player";
import { useDevice } from "@/lib/hooks/use-device";

function getSessionToken(sessionId: string): string | null {
  try {
    const stored = sessionStorage.getItem(`session_token_${sessionId}`);
    if (stored) {
      try { localStorage.setItem(`session_token_${sessionId}`, stored); } catch {}
      return stored;
    }
  } catch {}
  try {
    const stored = localStorage.getItem(`session_token_${sessionId}`);
    if (stored) return stored;
  } catch {}
  return null;
}

export default function SessionClient({ sessionId }: { sessionId: string }) {
  const [sessionToken] = useState(() => getSessionToken(sessionId));
  const device = useDevice();

  // Add fullscreen class for landscape mobile — hides nav/footer via CSS
  useEffect(() => {
    if (device.isMobile && device.orientation === "landscape") {
      document.body.classList.add("session-landscape-fullscreen");
      return () => document.body.classList.remove("session-landscape-fullscreen");
    }
    document.body.classList.remove("session-landscape-fullscreen");
  }, [device.isMobile, device.orientation]);

  return (
    <ErrorBoundary>
      <StreamPlayer sessionId={sessionId} token={sessionToken} />
    </ErrorBoundary>
  );
}
