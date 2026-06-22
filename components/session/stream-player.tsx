"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { deleteSession, getSessionStatus } from "@/lib/api/session";
import type { SessionStatusResponse } from "@/lib/api/types";
import { useSessionCountdown } from "@/lib/hooks/use-session-countdown";
import { useDevice } from "@/lib/hooks/use-device";
import { toast } from "@/lib/toast";

import { VncCanvas } from "./vnc-canvas";
import { SessionHeader } from "./session-header";
import { SessionLoading } from "./session-loading";
import { SessionDead } from "./session-dead";
import { MobileKeyboard, type MobileKeyboardHandle } from "./mobile-keyboard";
import { useSessionPoll } from "./use-session-poll";
import type RFB from "@novnc/novnc";

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
  const rfbRef = useRef<RFB | null>(null);
  const keyboardRef = useRef<MobileKeyboardHandle>(null);

  const device = useDevice();
  const countdown = useSessionCountdown(status?.remaining_seconds ?? null);
  const isReady = status?.status === "ready";
  const isDead = status?.status === "dead";
  const isLandscapeMobile = device.isMobile && device.orientation === "landscape";

  // Countdown expiry — grace period + server re-check
  const [expiryGrace, setExpiryGrace] = useState(false);

  useEffect(() => {
    if (!isReady || !countdown.isExpired) return;
    const timer = setTimeout(() => setExpiryGrace(true), 5000);
    return () => clearTimeout(timer);
  }, [isReady, countdown.isExpired]);

  useEffect(() => {
    if (!expiryGrace) return;
    let cancelled = false;
    (async () => {
      try {
        const s = await getSessionStatus(sessionId);
        if (cancelled) return;
        if (s.status === "dead") {
          setStatus((prev) => (prev ? { ...prev, status: "dead" } : prev));
          setRfbConnected(false);
        } else {
          setStatus(s);
        }
      } catch {
        // Network error — wait for next heartbeat
      } finally {
        if (!cancelled) setExpiryGrace(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [expiryGrace, sessionId]);

  // Warn at 1 minute
  useEffect(() => {
    if (isReady && countdown.isCritical) {
      toast.warning("Session expires in less than 1 minute.");
    }
  }, [isReady, countdown.isCritical]);

  // beforeunload warning
  useEffect(() => {
    if (!isReady) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isReady]);

  // Cross-tab coordination
  useEffect(() => {
    const channel = new BroadcastChannel(`cleanroom-session-${sessionId}`);
    channel.onmessage = (e) => {
      if (e.data === "destroyed") {
        setStatus((prev) => (prev ? { ...prev, status: "dead" } : prev));
        setRfbConnected(false);
        setDeadReason("destroyed");
      }
    };
    return () => channel.close();
  }, [sessionId]);

  // Clean up tokens when session dies
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
    setStatus((prev) => (prev ? { ...prev, status: "dead" } : prev));
    setRfbConnected(false);
  }, []);
  const onNotFound = useCallback(() => {
    setDeadReason("not_found");
    setStatus({
      session_id: sessionId,
      status: "dead",
      age_seconds: 0,
      expires_at: null,
      remaining_seconds: 0,
    });
  }, [sessionId]);
  useSessionPoll({ sessionId, onStatus, onDead, onNotFound });

  // Destroy
  const handleDestroy = useCallback(async () => {
    if (destroySentRef.current) return;
    destroySentRef.current = true;
    setDestroying(true);
    setRfbConnected(false);
    try {
      if (!token) {
        toast.error("No session token — cannot destroy");
        destroySentRef.current = false;
        setDestroying(false);
        return;
      }
      await deleteSession(sessionId, token);
      setStatus((prev) => (prev ? { ...prev, status: "dead" } : null));
      toast.success("Session destroyed. All data wiped.");
      try {
        const channel = new BroadcastChannel(`cleanroom-session-${sessionId}`);
        channel.postMessage("destroyed");
        channel.close();
      } catch {}
      setDestroying(false);
    } catch (err: unknown) {
      try {
        const s = await getSessionStatus(sessionId);
        if (s.status === "dead") {
          setStatus((prev) => (prev ? { ...prev, status: "dead" } : null));
          toast.success("Session destroyed. All data wiped.");
          setDestroying(false);
          return;
        }
      } catch {
        /* session might be gone */
      }
      destroySentRef.current = false;
      setDestroying(false);
      toast.error(err instanceof Error ? err.message : "Failed to destroy session");
    }
  }, [sessionId, token]);

  const onVncConnect = useCallback(() => setRfbConnected(true), []);
  const onVncDisconnect = useCallback(() => setRfbConnected(false), []);
  const onReconnectFailed = useCallback(() => setRfbReconnectFailed(true), []);
  const onRfbRef = useCallback((rfb: RFB | null) => {
    rfbRef.current = rfb;
  }, []);

  // Render states
  if (!status || status.status === "creating") return <SessionLoading />;
  if (isDead) return <SessionDead reason={deadReason} />;

  if (isReady && !token) {
    return (
      <div className="relative min-h-[calc(100vh-60px)] flex items-center justify-center">
        <div className="absolute inset-0 pointer-events-none grid-bg-sm" />
        <div className="relative z-10 text-center max-w-md">
          <div className="text-error text-sm font-bold tracking-[0.15em] uppercase mb-2">
            Missing session token
          </div>
          <div className="text-white-mid text-xs leading-[1.75]">
            No authentication token found for this session. You may need to rejoin from the
            queue or payment page.
          </div>
        </div>
      </div>
    );
  }

  if (isReady) {
    // Fullscreen mode for landscape mobile — maximize VNC area
    const containerClass = isLandscapeMobile
      ? "flex-1 flex flex-col overflow-hidden min-h-0"
      : "flex-1 flex flex-col overflow-hidden min-h-0";

    return (
      <div className={containerClass}>
        {/* Hide header in landscape mobile for maximum screen usage */}
        {!isLandscapeMobile && (
          <SessionHeader
            connected={rfbConnected}
            reconnectFailed={rfbReconnectFailed}
            expiresAt={status.expires_at}
            countdown={countdown.display}
            countdownWarning={countdown.isWarning}
            countdownCritical={countdown.isCritical}
            onDestroy={handleDestroy}
            destroying={destroying}
            rfbRef={rfbRef}
            keyboardRef={keyboardRef}
          />
        )}

        <VncCanvas
          sessionId={sessionId}
          token={token ?? null}
          onConnect={onVncConnect}
          onDisconnect={onVncDisconnect}
          onReconnectFailed={onReconnectFailed}
          onRfbRef={onRfbRef}
        />

        {/* Mobile keyboard (hidden textarea) */}
        <MobileKeyboard ref={keyboardRef} rfbRef={rfbRef} />

        {/* Landscape mobile: floating minimal controls */}
        {isLandscapeMobile && (
          <div className="absolute top-2 right-2 z-30 flex items-center gap-1">
            <div
              className={`w-2 h-2 rounded-full ${rfbConnected ? "bg-green" : "bg-error"}`}
            />
            <span className="text-[9px] text-white-mid font-mono">{countdown.display}</span>
          </div>
        )}
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
