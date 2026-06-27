"use client";

import { useEffect, useRef } from "react";
import { getSessionStatus } from "@/lib/api/session";
import { ApiError } from "@/lib/api/client";
import type { SessionStatusResponse } from "@/lib/api/types";

const HEARTBEAT_READY_MS = 5_000; // 5s while session is alive (detect expiry fast)
const HEARTBEAT_CREATING_MS = 2_000; // 2s while session is being created
const NOT_FOUND_TIMEOUT_MS = 5_000; // give up after 5s of 404s
const MAX_CONSECUTIVE_ERRORS = 30; // give up after 30 consecutive non-404 errors (~60s at 2s interval)

interface UseSessionPollOptions {
  sessionId: string;
  onStatus: (s: SessionStatusResponse) => void;
  onDead: () => void;
  onNotFound: () => void;
  isExpired?: boolean;
}

/**
 * Polls session status.
 *
 * - While creating/destroying: every 2s
 * - Once ready: every 5s (fast expiry detection)
 * - On 404: retries for 5s then calls onNotFound
 * - On 500/network: retries indefinitely (server may be deploying)
 * - If countdown expired: immediately calls onNotFound
 */
export function useSessionPoll({
  sessionId,
  onStatus,
  onDead,
  onNotFound,
  isExpired,
}: UseSessionPollOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const first404Ref = useRef<number | null>(null);
  const readyRef = useRef(false);
  const destroyedRef = useRef(false);
  const consecutiveErrorRef = useRef(0);

  useEffect(() => {
    let active = true;

    async function poll() {
      if (!active || !sessionId || destroyedRef.current) return;

      // If the countdown expired, immediately show expired state
      if (isExpired) {
        destroyedRef.current = true;
        onNotFound();
        return;
      }

      try {
        const s = await getSessionStatus(sessionId);
        if (!active || destroyedRef.current) return;

        first404Ref.current = null;
        consecutiveErrorRef.current = 0; // reset on success
        onStatus(s);

        if (s.status === "dead") {
          destroyedRef.current = true;
          onDead();
          return;
        }

        if (s.status === "ready") {
          readyRef.current = true;
        }

        // Creating / destroying — poll fast; ready — poll every 5s
        const interval = readyRef.current
          ? HEARTBEAT_READY_MS
          : HEARTBEAT_CREATING_MS;
        timerRef.current = setTimeout(poll, interval);
      } catch (err: unknown) {
        if (!active || destroyedRef.current) return;

        // Check for 404 using the ApiError status code
        const is404 =
          err instanceof ApiError
            ? err.status === 404
            : err instanceof Error &&
              (err.message.includes("404") ||
                err.message.includes("not_found") ||
                err.message.includes("Not Found"));

        if (is404) {
          if (first404Ref.current === null) {
            first404Ref.current = Date.now();
          }
          if (Date.now() - first404Ref.current > NOT_FOUND_TIMEOUT_MS) {
            destroyedRef.current = true;
            onNotFound();
            return;
          }
        } else {
          // Non-404 error: reset the 404 timer (might be transient)
          first404Ref.current = null;
          consecutiveErrorRef.current += 1;
          if (consecutiveErrorRef.current >= MAX_CONSECUTIVE_ERRORS) {
            destroyedRef.current = true;
            onNotFound();
            return;
          }
        }

        const interval = readyRef.current
          ? HEARTBEAT_READY_MS
          : HEARTBEAT_CREATING_MS;
        timerRef.current = setTimeout(poll, interval);
      }
    }

    poll();

    return () => {
      active = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [sessionId, onStatus, onDead, onNotFound, isExpired]);
}
