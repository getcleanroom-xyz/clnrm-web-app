"use client";

import { useEffect, useRef } from "react";
import { getSessionStatus } from "@/lib/api/session";
import type { SessionStatusResponse } from "@/lib/api/types";

const MAX_POLL_RETRIES = 10;

interface UseSessionPollOptions {
  sessionId: string;
  onStatus: (s: SessionStatusResponse) => void;
  onDead: () => void;
}

/**
 * Polls session status.
 * - Fast (2s) while creating, to detect when session becomes ready.
 * - Pauses once ready; schedules one final check at exact expiry.
 * - On 404: retries up to MAX_POLL_RETRIES, then marks as dead.
 *   (First few 404s are normal — session is still being created server-side.)
 */
export function useSessionPoll({ sessionId, onStatus, onDead }: UseSessionPollOptions) {
  const statusRef = useRef<SessionStatusResponse["status"]>("creating");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryRef = useRef(0);

  useEffect(() => {
    let active = true;

    async function poll() {
      if (!active || !sessionId) return;

      try {
        const s = await getSessionStatus(sessionId);
        if (!active) return;

        statusRef.current = s.status;
        retryRef.current = 0; // reset on success
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
      } catch (err: unknown) {
        if (!active) return;

        if (err instanceof Error && err.message.includes("not found")) {
          retryRef.current += 1;

          // After enough 404s, session doesn't exist — mark dead
          if (retryRef.current >= MAX_POLL_RETRIES) {
            onDead();
            return;
          }
        }

        // Retry in 2s (transient error or 404 during creation)
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
