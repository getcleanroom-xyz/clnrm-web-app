"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { getSessionStatus, deleteSession } from "@/lib/api/session";
import { getToken } from "@/lib/token-storage";
import type { SessionStatusResponse } from "@/lib/api/types";
import { useSessionCountdown } from "@/lib/hooks/use-session-countdown";
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

const API_BASE =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL ?? "https://api.getcleanroom.xyz"
    : "";

export function StreamPlayer({ sessionId, token }: StreamPlayerProps) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // destroySentRef prevents double-destroy from concurrent triggers
  // (e.g. the Destroy button AND the auto-expire effect both firing).
  // It is deliberately NOT reset on error here — the session endpoint
  // returns 404 once the session is gone, so a retry would always succeed
  // or produce a harmless 404, both of which are handled gracefully.
  const destroySentRef = useRef(false);
  const [status, setStatus] = useState<SessionStatusResponse | null>(null);
  const [destroying, setDestroying] = useState(false);

  const countdown = useSessionCountdown(status?.expires_at ?? null);
  const isReady = status?.status === "ready";
  const isDead = status?.status === "dead" || status?.status === "destroying";
  const isCreating = !status || status.status === "creating";

  // Auto-mark dead when the countdown expires client-side.
  // The backend watchdog will clean up the actual container independently.
  useEffect(() => {
    if (!countdown.isExpired) return;
    if (destroySentRef.current) return;
    destroySentRef.current = true;
    setStatus((prev) => (prev ? { ...prev, status: "dead" } : prev));
  }, [countdown.isExpired]);

  // Poll session status every 2 s so the UI stays in sync with the backend.
  useEffect(() => {
    let active = true;
    async function poll() {
      try {
        const s = await getSessionStatus(sessionId);
        if (!active) return;
        setStatus(s);
      } catch (err: unknown) {
        if (!active) return;
        if (err instanceof Error && err.message.includes("not found")) {
          setStatus((prev) => (prev ? { ...prev, status: "dead" } : null));
        }
      }
    }
    poll();
    const id = setInterval(poll, 2000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [sessionId]);

  const handleDestroy = useCallback(async () => {
    // Guard: only one destroy in flight at a time.
    if (destroySentRef.current) return;
    destroySentRef.current = true;
    setDestroying(true);

    const authToken = token ?? getToken() ?? "";
    try {
      await deleteSession(sessionId, authToken);
      setStatus((prev) => (prev ? { ...prev, status: "dead" } : null));
      toast.success("Session destroyed. All data wiped.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to destroy session";
      // If the session is already gone, treat it as success.
      if (msg.includes("not found") || msg.includes("404")) {
        setStatus((prev) => (prev ? { ...prev, status: "dead" } : null));
        toast.success("Session already ended.");
      } else {
        // Allow retry — reset the guard on genuine error.
        destroySentRef.current = false;
        setDestroying(false);
        toast.error(msg);
      }
    }
  }, [sessionId, token]);

  // ── Loading / Creating state ──
  if (isCreating) {
    return (
      <div className="relative min-h-[calc(100vh-60px)] flex items-center justify-center">
        <div className="absolute inset-0 pointer-events-none grid-bg-sm" />
        <div className="relative z-10 text-center">
          <Spinner size={32} weight="bold" className="text-green animate-spin mx-auto mb-4" />
          <div className="text-green text-sm font-bold tracking-[0.15em] uppercase">
            Starting session…
          </div>
          <div className="text-white-mid text-xs mt-2">Preparing your browser</div>
        </div>
      </div>
    );
  }

  // ── Dead / Expired state ──
  if (isDead || countdown.isExpired) {
    return (
      <div className="relative min-h-[calc(100vh-60px)] flex items-center justify-center">
        <div className="absolute inset-0 pointer-events-none grid-bg-sm" />
        <div className="relative z-10 text-center max-w-md">
          <WarningCircle
            size={48}
            weight="bold"
            className="text-error mx-auto mb-4"
          />
          <div className="text-error text-sm font-bold tracking-[0.15em] uppercase mb-2">
            {countdown.isExpired ? "Session expired" : "Session ended"}
          </div>
          <div className="text-white-mid text-xs leading-[1.75] mb-6">
            {countdown.isExpired
              ? "The session time limit was reached. Your container has been destroyed and all data wiped."
              : "This session has been destroyed. All data has been wiped and cannot be recovered."}
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

  // ── Ready — embed the noVNC UI served by the backend ──
  if (isReady) {
    // The backend's /stream/{id}/ui endpoint serves a self-contained noVNC
    // HTML page that connects back to the backend WebSocket proxy.
    // We MUST point directly at the backend (not /api/… which would route
    // through Next.js and 404) and MUST use the absolute API_BASE URL.
    const vncUrl = token
      ? `${API_BASE}/stream/${sessionId}/ui?token=${encodeURIComponent(token)}`
      : `${API_BASE}/stream/${sessionId}/ui`;

    return (
      <div className="relative min-h-[calc(100vh-60px)] flex flex-col">
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-green/12 bg-surface/80 backdrop-blur-sm shrink-0">
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
              <span className="text-xs text-green font-bold tracking-[0.1em] uppercase">
                Connected
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {status.expires_at && (
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-white-dim" />
                <span
                  className={`text-xs font-mono ${
                    countdown.isCritical
                      ? "text-error"
                      : countdown.isWarning
                        ? "text-[#D4A02B]"
                        : "text-white-mid"
                  }`}
                >
                  {countdown.display}
                </span>
              </div>
            )}
            <button
              onClick={handleDestroy}
              disabled={destroying}
              className="clip-spell inline-flex items-center gap-1.5 border border-error/40 text-error text-[10px] font-bold tracking-[0.15em] uppercase px-3 py-1.5 transition-all hover:bg-error/10 disabled:opacity-40"
            >
              <Stop size={12} />
              {destroying ? "Ending…" : "Destroy"}
            </button>
          </div>
        </div>

        {/* Warning banners */}
        {countdown.isCritical && !countdown.isExpired && (
          <div className="flex items-center gap-2 px-4 py-2 bg-error/10 border-b border-error/20 text-error text-[11px] shrink-0">
            <WarningCircle size={13} weight="fill" />
            <span>
              Less than {countdown.remainingSeconds}s remaining. Session will
              end automatically.
            </span>
          </div>
        )}

        {/* noVNC iframe — fills all remaining space */}
        <div className="flex-1 bg-black relative">
          <iframe
            ref={iframeRef}
            src={vncUrl}
            className="absolute inset-0 w-full h-full border-0"
            allow="clipboard-read; clipboard-write"
            title="CleanRoom Browser Session"
          />
        </div>
      </div>
    );
  }

  // ── Fallback (unexpected status) ──
  return (
    <div className="relative min-h-[calc(100vh-60px)] flex items-center justify-center">
      <div className="absolute inset-0 pointer-events-none grid-bg-sm" />
      <div className="relative z-10 text-center">
        <Spinner
          size={32}
          weight="bold"
          className="text-green animate-spin mx-auto mb-4"
        />
        <div className="text-green text-sm font-bold tracking-[0.15em] uppercase">
          Loading…
        </div>
      </div>
    </div>
  );
}
