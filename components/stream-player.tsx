"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { getSessionStatus, deleteSession } from "@/lib/api/session";
import { ApiError } from "@/lib/api/client";
import type { SessionStatus } from "@/lib/api/types";
import { toast } from "@/lib/toast";
import {
  ArrowCircleLeft,
  Spinner,
  Clock,
  Stop,
  WarningCircle,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { WS_BASE } from "@/lib/api/ws";

interface StreamPlayerProps {
  sessionId: string;
  token?: string | null;
}

/**
 * Derives display countdown from expires_at. Pure function — no hooks,
 * no side effects, no stale-state races.
 */
function formatCountdown(expiresAt: string | null | undefined): {
  display: string;
  isExpired: boolean;
  remainingSeconds: number;
} {
  if (!expiresAt) return { display: "--:--", isExpired: false, remainingSeconds: 0 };
  const ms = new Date(expiresAt).getTime() - Date.now();
  const remainingSeconds = Math.max(0, Math.floor(ms / 1000));
  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  return {
    display: `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`,
    isExpired: remainingSeconds <= 0,
    remainingSeconds,
  };
}

export function StreamPlayer({ sessionId, token }: StreamPlayerProps) {
  const router = useRouter();

  // --- Refs for mutable state accessed inside effects / callbacks ---
  const containerRef = useRef<HTMLDivElement>(null);
  const rfbRef = useRef<import("@novnc/novnc").default | null>(null);
  const mountedRef = useRef(false);
  const tokenRef = useRef<string | null | undefined>(token);
  const sessionStatusRef = useRef<SessionStatus>("creating");
  const destroyInProgressRef = useRef(false);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Single source of truth for session state ---
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("creating");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [rfbConnected, setRfbConnected] = useState(false);
  const [destroying, setDestroying] = useState(false);
  const [countdown, setCountdown] = useState(formatCountdown(null));

  // Keep refs in sync with latest values (avoids stale closures in effects)
  tokenRef.current = token;
  sessionStatusRef.current = sessionStatus;

  const isReady = sessionStatus === "ready";
  const isDead = sessionStatus === "dead";

  // --- Countdown ticker (pure display, never drives state transitions) ---
  useEffect(() => {
    if (!expiresAt) {
      setCountdown(formatCountdown(null));
      return;
    }
    // Immediate update
    setCountdown(formatCountdown(expiresAt));
    // Tick every second
    countdownTimerRef.current = setInterval(() => {
      setCountdown(formatCountdown(expiresAt));
    }, 1000);
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [expiresAt]);

  // --- Mount / unmount tracking ---
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // --- Polling state machine ---
  // States: creating → (poll every 2s) → ready → (single poll at expiry) → dead
  // Any error during creating: retry in 2s.
  // Any error during ready: retry in 2s (server might be temporarily unreachable).
  useEffect(() => {
    let active = true;

    async function poll() {
      if (!active) return;

      try {
        const s = await getSessionStatus(sessionId);
        if (!active) return;

        setSessionStatus(s.status);
        setExpiresAt(s.expires_at ?? null);

        if (s.status === "dead") {
          setRfbConnected(false);
          return; // terminal state — stop polling
        }

        if (s.status === "ready" && s.expires_at) {
          const msUntilExpiry = new Date(s.expires_at).getTime() - Date.now();
          if (msUntilExpiry > 0) {
            // Schedule one final poll at the exact expiry moment
            pollTimerRef.current = setTimeout(poll, msUntilExpiry);
            return;
          }
          // expires_at is in the past — fall through to 2s poll
        }

        // creating, destroying, or ready-without-expiry: poll every 2s
        pollTimerRef.current = setTimeout(poll, 2000);
      } catch (err: unknown) {
        if (!active) return;

        // 404 during creating = session not registered yet, keep polling.
        // 404 during ready = session was deleted, mark dead.
        if (err instanceof ApiError && err.status === 404) {
          if (sessionStatusRef.current === "ready") {
            setSessionStatus("dead");
            setRfbConnected(false);
            return;
          }
          // still creating — keep polling
        }

        // Any other error: retry in 2s
        pollTimerRef.current = setTimeout(poll, 2000);
      }
    }

    poll();

    return () => {
      active = false;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };

  }, [sessionId]);

  // --- RFB connection (fires once when session becomes ready) ---
  const connectRfb = useCallback(() => {
    if (!containerRef.current || !mountedRef.current) return;

    const currentToken = tokenRef.current;
    const wsPath = currentToken
      ? `/stream/${sessionId}?token=${encodeURIComponent(currentToken)}`
      : `/stream/${sessionId}`;
    const wsUrl = `${WS_BASE}${wsPath}`;

    if (typeof window === "undefined") return;
    import("@novnc/novnc").then(({ default: RFB }) => {
      if (!mountedRef.current || !containerRef.current) return;

      if (rfbRef.current) {
        rfbRef.current.disconnect();
        rfbRef.current = null;
      }

      const rfb = new RFB(containerRef.current, wsUrl, {
        shared: true,
        repeaterID: "",
        wsProtocols: ["binary"],
      });

      rfb.scaleViewport = true;
      rfb.resizeSession = false;

      rfb.addEventListener("connect", () => {
        if (!mountedRef.current) return;
        setRfbConnected(true);
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
        if (containerRef.current) {
          containerRef.current.style.width = "";
          containerRef.current.style.height = "";
        }
      });

      rfb.addEventListener("disconnect", () => {
        if (!mountedRef.current) return;
        setRfbConnected(false);
        // Only auto-reconnect while session is still alive
        if (sessionStatusRef.current === "ready") {
          reconnectTimerRef.current = setTimeout(connectRfb, 3000);
        }
      });

      rfb.addEventListener("credentialsrequired", () => {
        rfb.sendCredentials({ password: "" });
      });

      rfbRef.current = rfb;
    });
  }, [sessionId]);

  useEffect(() => {
    if (!isReady) return;
    connectRfb();
    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (rfbRef.current) {
        rfbRef.current.disconnect();
        rfbRef.current = null;
      }
    };
  }, [isReady, connectRfb]);

  // --- Destroy handler ---
  const handleDestroy = useCallback(async () => {
    if (destroyInProgressRef.current) return;
    destroyInProgressRef.current = true;
    setDestroying(true);
    try {
      await deleteSession(sessionId, token ?? "");
      setSessionStatus("dead");
      setRfbConnected(false);
      rfbRef.current?.disconnect();
      toast.success("Session destroyed. All data wiped.");
    } catch (err: unknown) {
      destroyInProgressRef.current = false;
      setDestroying(false);
      const message = err instanceof Error ? err.message : "Failed to destroy session";
      toast.error(message);
    }
  }, [sessionId, token]);

  // --- Render ---

  // Loading / creating
  if (!expiresAt && sessionStatus === "creating") {
    return (
      <div className="relative min-h-[calc(100vh-60px)] flex items-center justify-center">
        <div className="absolute inset-0 pointer-events-none grid-bg-sm" />
        <div className="relative z-10 text-center">
          <Spinner size={32} weight="bold" className="text-green animate-spin mx-auto mb-4" />
          <div className="text-green text-sm font-bold tracking-[0.15em] uppercase">Starting session...</div>
          <div className="text-white-mid text-xs mt-2">Preparing your browser</div>
        </div>
      </div>
    );
  }

  // Dead
  if (isDead) {
    return (
      <div className="relative min-h-[calc(100vh-60px)] flex items-center justify-center">
        <div className="absolute inset-0 pointer-events-none grid-bg-sm" />
        <div className="relative z-10 text-center max-w-md">
          <WarningCircle size={48} weight="bold" className="text-error mx-auto mb-4" />
          <div className="text-error text-sm font-bold tracking-[0.15em] uppercase mb-2">Session ended</div>
          <div className="text-white-mid text-xs leading-[1.75] mb-6">
            This session has been destroyed. All data has been wiped and cannot be recovered.
          </div>
          <button
            onClick={() => router.push("/")}
            className="clip-spell inline-flex items-center gap-1.5 border border-green/40 text-green text-xs font-bold tracking-[0.15em] uppercase px-6 py-3 transition-all hover:bg-green-dim/30"
          >
            <ArrowCircleLeft size={14} />
            Return home
          </button>
        </div>
      </div>
    );
  }

  // Ready
  if (isReady) {
    return (
      <div className="relative min-h-[calc(100vh-60px)] flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b border-green/12 bg-surface/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="text-white-dim hover:text-foreground transition-colors"
              title="Leave session"
            >
              <ArrowCircleLeft size={18} />
            </button>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${rfbConnected ? "bg-green animate-pulse" : "bg-error"}`} />
              <span className={`text-xs font-bold tracking-[0.1em] uppercase ${rfbConnected ? "text-green" : "text-error"}`}>
                {rfbConnected ? "Connected" : "Connecting..."}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {expiresAt && (
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-white-dim" />
                <span className="text-xs text-white-mid font-mono">{countdown.display}</span>
              </div>
            )}
            <button
              onClick={handleDestroy}
              disabled={destroying}
              className="clip-spell inline-flex items-center gap-1.5 border border-error/40 text-error text-[10px] font-bold tracking-[0.15em] uppercase px-3 py-1.5 transition-all hover:bg-error/10 disabled:opacity-40"
            >
              <Stop size={12} />
              {destroying ? "..." : "Destroy"}
            </button>
          </div>
        </div>

        <div ref={containerRef} className="flex-1 bg-black relative overflow-hidden" />
      </div>
    );
  }

  // Fallback (destroying or unknown)
  return (
    <div className="relative min-h-[calc(100vh-60px)] flex items-center justify-center">
      <div className="absolute inset-0 pointer-events-none grid-bg-sm" />
      <div className="relative z-10 text-center">
        <Spinner size={32} weight="bold" className="text-green animate-spin mx-auto mb-4" />
        <div className="text-green text-sm font-bold tracking-[0.15em] uppercase">
          {sessionStatus === "destroying" ? "Destroying session..." : "Loading..."}
        </div>
      </div>
    </div>
  );
}
