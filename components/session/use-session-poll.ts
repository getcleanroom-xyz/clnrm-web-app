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
 * Polls session status. Fast (2s) while creating, then schedules one
 * final check at the exact expiry moment. Retries on transient errors.
 */
export function useSessionPoll({ sessionId, onStatus, onDead }: UseSessionPollOptions) {
  const statusRef = useRef<SessionStatusResponse["status"]>("creating");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;

    async function poll() {
      if (!active || !sessionId) return;

      try {
        const s = await getSessionStatus(sessionId);
        if (!active) return;

        statusRef.current = s.status;
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

        // Default: poll again in 2s
        timerRef.current = setTimeout(poll, 2000);
      } catch (err: unknown) {
        if (!active) return;

        // 404 during creating = session not registered yet, keep polling.
        // 404 during ready = session was deleted, mark dead.
        if (err instanceof Error && err.message.includes("not found")) {
          if (statusRef.current === "ready") {
            onDead();
            return;
          }
        }

        // Any error: retry in 2s
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
