"use client";

import { useEffect, useRef } from "react";
import { getSessionStatus } from "@/lib/api/session";
import type { SessionStatusResponse } from "@/lib/api/types";

const SESSION_NOT_FOUND_TIMEOUT_MS = 10_000;
const HEARTBEAT_INTERVAL_MS = 30_000; // 30s heartbeat after ready

interface UseSessionPollOptions {
  sessionId: string;
  onStatus: (s: SessionStatusResponse) => void;
  onDead: () => void;
  onNotFound: () => void;
}

/**
 * Polls session status. While creating/destroying: every 2s.
 * Once ready: every 30s heartbeat to detect server-side death.
 * On 404: retries for 10s then calls onNotFound.
 * On 500/network: retries indefinitely (server may be deploying).
 */
export function useSessionPoll({ sessionId, onStatus, onDead, onNotFound }: UseSessionPollOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const first404Ref = useRef<number | null>(null);
  const readyRef = useRef(false);

  useEffect(() => {
    let active = true;

    async function poll() {
      if (!active || !sessionId) return;

      try {
        const s = await getSessionStatus(sessionId);
        if (!active) return;

        first404Ref.current = null;
        onStatus(s);

        if (s.status === "dead") {
          onDead();
          return;
        }

        if (s.status === "ready") {
          readyRef.current = true;
          // Heartbeat: keep checking if server-side session died
          timerRef.current = setTimeout(poll, HEARTBEAT_INTERVAL_MS);
          return;
        }

        // Creating / destroying — poll fast
        timerRef.current = setTimeout(poll, 2000);
      } catch (err: unknown) {
        if (!active) return;

        // Distinguish 404 (session gone) from 500/network (transient)
        const is404 = err instanceof Error && (
          err.message.includes("404") || err.message.includes("not_found") || err.message.includes("Not Found")
        );

        if (is404) {
          if (first404Ref.current === null) {
            first404Ref.current = Date.now();
          }
          if (Date.now() - first404Ref.current > SESSION_NOT_FOUND_TIMEOUT_MS) {
            onNotFound();
            return;
          }
        }
        // 500/network errors: keep retrying forever (server may be deploying)

        const interval = readyRef.current ? HEARTBEAT_INTERVAL_MS : 2000;
        timerRef.current = setTimeout(poll, interval);
      }
    }

    poll();

    return () => {
      active = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [sessionId, onStatus, onDead, onNotFound]);
}
