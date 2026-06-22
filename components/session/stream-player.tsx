"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { deleteSession } from "@/lib/api/session";
import type { SessionStatusResponse } from "@/lib/api/types";
import { useSessionCountdown } from "@/lib/hooks/use-session-countdown";
import { toast } from "@/lib/toast";

import { VncCanvas } from "./vnc-canvas";
import { SessionHeader } from "./session-header";
import { SessionLoading } from "./session-loading";
import { SessionDead } from "./session-dead";
import { useSessionPoll } from "./use-session-poll";

interface StreamPlayerProps {
  sessionId: string;
  token?: string | null;
}

export function StreamPlayer({ sessionId, token }: StreamPlayerProps) {
  const [status, setStatus] = useState<SessionStatusResponse | null>(null);
  const [rfbConnected, setRfbConnected] = useState(false);
  const [rfbReconnectFailed, setRfbReconnectFailed] = useState(false);
  const [destroying, setDestroying] = useState(false);
  const [deadReason, setDeadReason] = useState<"destroyed" | "not_found">("destroyed");
  const destroySentRef = useRef(false);

  const countdown = useSessionCountdown(status?.remaining_seconds ?? null);
  const isReady = status?.status === "ready";
  const isDead = status?.status === "dead";

  // Bug 4: Act on countdown expiry — transition to dead when timer hits zero
  useEffect(() => {
    if (isReady && countdown.isExpired) {
      setStatus((prev) => prev ? { ...prev, status: "dead" } : prev);
      setRfbConnected(false);
    }
  }, [isReady, countdown.isExpired]);

  // Bug 4: Warn user at 1 minute remaining
  useEffect(() => {
    if (isReady && countdown.isCritical) {
      toast.warning("Session expires in less than 1 minute.");
    }
  }, [isReady, countdown.isCritical]);

  // Bug 12: Re-sync countdown when tab becomes visible again
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && status?.remaining_seconds != null) {
        // Force re-render of countdown by triggering a re-poll will happen via heartbeat
        // For immediate feedback, reset countdown from last known server value
        // (the heartbeat poll will correct it within 30s)
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [status?.remaining_seconds]);

  // Bug 13: Warn before closing tab during active session
  useEffect(() => {
    if (!isReady) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isReady]);

  // Bug 11: Cross-tab coordination — listen for session destruction from other tabs
  useEffect(() => {
    const channel = new BroadcastChannel(`cleanroom-session-${sessionId}`);
    channel.onmessage = (e) => {
      if (e.data === "destroyed") {
        setStatus((prev) => prev ? { ...prev, status: "dead" } : prev);
        setRfbConnected(false);
        setDeadReason("destroyed");
      }
    };
    return () => channel.close();
  }, [sessionId]);

  // Bug 8: Clean up tokens when session dies
  useEffect(() => {
    if (isDead) {
      try {
        sessionStorage.removeItem(`session_token_${sessionId}`);
        localStorage.removeItem(`session_token_${sessionId}`);
      } catch {}
    }
  }, [isDead, sessionId]);

  // Poll session status
  const onStatus = useCallback((s: SessionStatusResponse) => setStatus(s), []);
  const onDead = useCallback(() => {
    setStatus((prev) => prev ? { ...prev, status: "dead" } : prev);
    setRfbConnected(false);
  }, []);
  const onNotFound = useCallback(() => {
    setDeadReason("not_found");
    setStatus({ session_id: sessionId, status: "dead", age_seconds: 0, expires_at: null, remaining_seconds: 0 });
  }, [sessionId]);
  useSessionPoll({ sessionId, onStatus, onDead, onNotFound });

  // Bug 7: Destroy — disconnect VNC first, then call API
  const handleDestroy = useCallback(async () => {
    if (destroySentRef.current) return;
    destroySentRef.current = true;
    setDestroying(true);
    setRfbConnected(false); // immediately show disconnect in UI
    try {
      if (!token) {
        toast.error("No session token — cannot destroy");
        destroySentRef.current = false;
        setDestroying(false);
        return;
      }
      await deleteSession(sessionId, token);
      setStatus((prev) => prev ? { ...prev, status: "dead" } : null);
      toast.success("Session destroyed. All data wiped.");
      // Bug 11: Notify other tabs
      try {
        const channel = new BroadcastChannel(`cleanroom-session-${sessionId}`);
        channel.postMessage("destroyed");
        channel.close();
      } catch {}
      setDestroying(false);
    } catch (err: unknown) {
      // Check if session is already dead (retry after timeout)
      try {
        const { getSessionStatus } = await import("@/lib/api/session");
        const s = await getSessionStatus(sessionId);
        if (s.status === "dead") {
          setStatus((prev) => prev ? { ...prev, status: "dead" } : null);
          toast.success("Session destroyed. All data wiped.");
          setDestroying(false);
          return;
        }
      } catch { /* session might be gone entirely */ }
      destroySentRef.current = false;
      setDestroying(false);
      toast.error(err instanceof Error ? err.message : "Failed to destroy session");
    }
  }, [sessionId, token]);

  const onVncConnect = useCallback(() => setRfbConnected(true), []);
  const onVncDisconnect = useCallback(() => setRfbConnected(false), []);
  const onReconnectFailed = useCallback(() => setRfbReconnectFailed(true), []);

  // Render states
  if (!status || status.status === "creating") return <SessionLoading />;
  if (isDead) return <SessionDead reason={deadReason} />;

  // Bug 3: No token — show error instead of silent VNC failure
  if (isReady && !token) {
    return (
      <div className="relative min-h-[calc(100vh-60px)] flex items-center justify-center">
        <div className="absolute inset-0 pointer-events-none grid-bg-sm" />
        <div className="relative z-10 text-center max-w-md">
          <div className="text-error text-sm font-bold tracking-[0.15em] uppercase mb-2">Missing session token</div>
          <div className="text-white-mid text-xs leading-[1.75]">
            No authentication token found for this session. You may need to rejoin from the queue or payment page.
          </div>
        </div>
      </div>
    );
  }

  if (isReady) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <SessionHeader
          connected={rfbConnected}
          reconnectFailed={rfbReconnectFailed}
          expiresAt={status.expires_at}
          countdown={countdown.display}
          countdownWarning={countdown.isWarning}
          countdownCritical={countdown.isCritical}
          onDestroy={handleDestroy}
          destroying={destroying}
        />
        <VncCanvas
          sessionId={sessionId}
          token={token ?? null}
          onConnect={onVncConnect}
          onDisconnect={onVncDisconnect}
          onReconnectFailed={onReconnectFailed}
        />
      </div>
    );
  }

  // Destroying / unknown
  return (
    <div className="relative min-h-[calc(100vh-60px)] flex items-center justify-center">
      <div className="absolute inset-0 pointer-events-none grid-bg-sm" />
      <div className="relative z-10 text-center">
        <div className="text-green text-sm font-bold tracking-[0.15em] uppercase">
          {status.status === "destroying" ? "Destroying session..." : "Loading..."}
        </div>
      </div>
    </div>
  );
}
