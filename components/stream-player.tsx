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

interface StreamPlayerProps {
  sessionId: string;
  token?: string | null;
}

function formatCountdown(expiresAt: string | null | undefined): {
  display: string;
  remainingSeconds: number;
} {
  if (!expiresAt) return { display: "--:--", remainingSeconds: 0 };
  const ms = new Date(expiresAt).getTime() - Date.now();
  const remainingSeconds = Math.max(0, Math.floor(ms / 1000));
  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  return {
    display: `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`,
    remainingSeconds,
  };
}

export function StreamPlayer({ sessionId, token }: StreamPlayerProps) {
  const router = useRouter();
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const destroyInProgressRef = useRef(false);
  const sessionStatusRef = useRef<SessionStatus>("creating");

  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("creating");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [destroying, setDestroying] = useState(false);
  const [countdown, setCountdown] = useState(formatCountdown(null));

  sessionStatusRef.current = sessionStatus;

  const isReady = sessionStatus === "ready";
  const isDead = sessionStatus === "dead";

  // Build the iframe URL — load directly from the backend so the
  // self-contained noVNC page constructs the correct WebSocket URL
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "https://api.getcleanroom.xyz";
  const streamUrl = token
    ? `${apiBase}/api/stream/${sessionId}/ui?token=${encodeURIComponent(token)}`
    : `${apiBase}/api/stream/${sessionId}/ui`;

  // Countdown ticker
  useEffect(() => {
    if (!expiresAt) {
      setCountdown(formatCountdown(null));
      return;
    }
    setCountdown(formatCountdown(expiresAt));
    countdownTimerRef.current = setInterval(() => {
      setCountdown(formatCountdown(expiresAt));
    }, 1000);
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [expiresAt]);

  // Polling state machine
  useEffect(() => {
    let active = true;

    async function poll() {
      if (!active) return;
      try {
        const s = await getSessionStatus(sessionId);
        if (!active) return;
        setSessionStatus(s.status);
        setExpiresAt(s.expires_at ?? null);

        if (s.status === "dead") return;

        if (s.status === "ready" && s.expires_at) {
          const ms = new Date(s.expires_at).getTime() - Date.now();
          if (ms > 0) {
            pollTimerRef.current = setTimeout(poll, ms);
            return;
          }
        }
        pollTimerRef.current = setTimeout(poll, 2000);
      } catch (err: unknown) {
        if (!active) return;
        if (err instanceof ApiError && err.status === 404) {
          if (sessionStatusRef.current === "ready") {
            setSessionStatus("dead");
            return;
          }
        }
        pollTimerRef.current = setTimeout(poll, 2000);
      }
    }

    poll();
    return () => {
      active = false;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [sessionId]);

  // Destroy handler
  const handleDestroy = useCallback(async () => {
    if (destroyInProgressRef.current) return;
    destroyInProgressRef.current = true;
    setDestroying(true);
    try {
      await deleteSession(sessionId, token ?? "");
      setSessionStatus("dead");
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

  // Ready — embed the backend's self-contained noVNC page in an iframe
  if (isReady) {
    return (
      <div className="relative min-h-[calc(100vh-60px)] flex flex-col">
        {/* Header bar */}
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
              <div className="w-2 h-2 rounded-full bg-green animate-pulse" />
              <span className="text-xs font-bold tracking-[0.1em] uppercase text-green">
                Connected
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

        {/* noVNC iframe — the backend serves a self-contained HTML page
            that handles all RFB protocol, rendering, and reconnection */}
        <iframe
          src={streamUrl}
          className="flex-1 w-full border-0 bg-black"
          title="CleanRoom Session"
          allow="clipboard-read; clipboard-write"
        />
      </div>
    );
  }

  // Fallback
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
