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
import { WS_BASE } from "@/lib/api/ws";
import RFB from "@novnc/novnc/core/rfb";

interface StreamPlayerProps {
  sessionId: string;
  token?: string | null;
}

export function StreamPlayer({ sessionId, token }: StreamPlayerProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const rfbRef = useRef<RFB | null>(null);
  const destroySentRef = useRef(false);
  const [status, setStatus] = useState<SessionStatusResponse | null>(null);
  const [connected, setConnected] = useState(false);
  const [destroying, setDestroying] = useState(false);

  const countdown = useSessionCountdown(status?.expires_at ?? null);
  const isReady = status?.status === "ready";

  // Auto-destroy on expiry
  useEffect(() => {
    if (!countdown.isExpired) return;
    if (destroySentRef.current) return;
    destroySentRef.current = true;
    setStatus((prev) => prev ? { ...prev, status: "dead" } : prev);
  }, [countdown.isExpired]);

  // Poll session status
  useEffect(() => {
    let active = true;
    async function poll() {
      try {
        const s = await getSessionStatus(sessionId);
        if (!active) return;
        setStatus(s);
        if (s.status === "ready") setConnected(true);
        if (s.status === "dead") setConnected(false);
      } catch (err: unknown) {
        if (!active) return;
        if (err instanceof Error && err.message.includes("not found")) {
          setStatus((prev) => prev ? { ...prev, status: "dead" } : null);
          setConnected(false);
        }
      }
    }
    poll();
    const id = setInterval(poll, 2000);
    return () => { active = false; clearInterval(id); };
  }, [sessionId]);

  // Connect noVNC when ready
  useEffect(() => {
    if (!isReady || !containerRef.current) return;

    const wsPath = token
      ? `/stream/${sessionId}?token=${encodeURIComponent(token)}`
      : `/stream/${sessionId}`;
    const wsUrl = `${WS_BASE}${wsPath}`;

    const rfb = new RFB(containerRef.current, wsUrl, {
      shared: true,
      repeaterID: "",
    });

    rfb.addEventListener("connect", () => setConnected(true));
    rfb.addEventListener("disconnect", () => setConnected(false));
    rfb.addEventListener("credentialsrequired", () => {
      // noVNC may ask for credentials; we don't need them
    });

    rfbRef.current = rfb;

    return () => {
      rfb.disconnect();
      rfbRef.current = null;
    };
  }, [isReady, sessionId, token]);

  const handleDestroy = useCallback(async () => {
    if (destroySentRef.current) return;
    destroySentRef.current = true;
    setDestroying(true);
    try {
      await deleteSession(sessionId, token ?? "");
      setStatus((prev) => prev ? { ...prev, status: "dead" } : null);
      setConnected(false);
      rfbRef.current?.disconnect();
      toast.success("Session destroyed. All data wiped.");
    } catch (err: unknown) {
      destroySentRef.current = false;
      setDestroying(false);
      const message = err instanceof Error ? err.message : "Failed to destroy session";
      toast.error(message);
    }
  }, [sessionId, token]);

  // Loading state
  if (!status || status.status === "creating") {
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

  // Dead state
  if (status.status === "dead") {
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

  // Ready - show noVNC canvas
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
              <div className={`w-2 h-2 rounded-full ${connected ? "bg-green animate-pulse" : "bg-error"}`} />
              <span className={`text-xs font-bold tracking-[0.1em] uppercase ${connected ? "text-green" : "text-error"}`}>
                {connected ? "Connected" : "Connecting..."}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {status.expires_at && (
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

        {/* noVNC container */}
        <div ref={containerRef} className="flex-1 bg-black relative overflow-hidden" />
      </div>
    );
  }

  // Fallback - unknown status
  return (
    <div className="relative min-h-[calc(100vh-60px)] flex items-center justify-center">
      <div className="absolute inset-0 pointer-events-none grid-bg-sm" />
      <div className="relative z-10 text-center">
        <Spinner size={32} weight="bold" className="text-green animate-spin mx-auto mb-4" />
        <div className="text-green text-sm font-bold tracking-[0.15em] uppercase">Loading...</div>
      </div>
    </div>
  );
}
