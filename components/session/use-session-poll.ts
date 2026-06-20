"use client";

import { useEffect, useRef } from "react";
import { getSessionStatus } from "@/lib/api/session";
import type { SessionStatusResponse } from "@/lib/api/types";

interface UseSessionPollOptions {
  sessionId: string;
  onStatus: (s: SessionStatusResponse) => void;
  onDead: () => void;
}

/**
 * Polls session status continuously until the session is found or expires.
 * - Fast (2s) while creating, to detect when session becomes ready.
 * - Pauses once ready; schedules one final check at exact expiry.
 * - On error: retries in 2s. Never marks dead from client side.
 *   The server is the authority on session lifecycle.
 */
export function useSessionPoll({ sessionId, onStatus, onDead }: UseSessionPollOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;

    async function poll() {
      if (!active || !sessionId) return;

      try {
        const s = await getSessionStatus(sessionId);
        if (!active) return;

        onStatus(s);

        if (s.status === "dead") {
          onDead();
          return; // terminal — stop polling
        }

        // Once ready with a known expiry, schedule one final check at expiry
        if (s.status === "ready" && s.expires_at) {
          const ms = new Date(s.expires_at).getTime() - Date.now();
          if (ms > 0) {
            timerRef.current = setTimeout(poll, ms);
            return;
          }
        }

        // Default: poll again in 2s (creating, destroying, or no expires_at)
        timerRef.current = setTimeout(poll, 2000);
      } catch {
        // Transient error or 404 during creation — keep polling
        if (!active) return;
        timerRef.current = setTimeout(poll, 2000);
      }
    }

    poll();

    return () => {
      active = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [sessionId, onStatus, onDead]);
}
