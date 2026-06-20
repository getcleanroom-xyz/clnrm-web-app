"use client";

import { useEffect, useRef } from "react";
import { getSessionStatus } from "@/lib/api/session";
import type { SessionStatusResponse } from "@/lib/api/types";

const SESSION_NOT_FOUND_TIMEOUT_MS = 60_000; // 60s before declaring session not found

interface UseSessionPollOptions {
  sessionId: string;
  onStatus: (s: SessionStatusResponse) => void;
  onDead: () => void;
  onNotFound: () => void;
}

/**
 * Polls session status.
 * - Fast (2s) while creating, to detect when session becomes ready.
 * - Pauses once ready; schedules one final check at exact expiry.
 * - On 404: keeps polling for 60s (session may still be creating server-side).
 *   After timeout, calls onNotFound — session genuinely doesn't exist.
 */
export function useSessionPoll({ sessionId, onStatus, onDead, onNotFound }: UseSessionPollOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstErrorRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;

    async function poll() {
      if (!active || !sessionId) return;

      try {
        const s = await getSessionStatus(sessionId);
        if (!active) return;

        firstErrorRef.current = null; // reset on success
        onStatus(s);

        if (s.status === "dead") {
          onDead();
          return;
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
      } catch {
        if (!active) return;

        // Track when the first error occurred
        if (firstErrorRef.current === null) {
          firstErrorRef.current = Date.now();
        }

        // If we've been getting errors for longer than the timeout, session doesn't exist
        if (Date.now() - firstErrorRef.current > SESSION_NOT_FOUND_TIMEOUT_MS) {
          onNotFound();
          return;
        }

        // Keep retrying
        timerRef.current = setTimeout(poll, 2000);
      }
    }

    poll();

    return () => {
      active = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [sessionId, onStatus, onDead, onNotFound]);
}
