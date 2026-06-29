"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { deleteSession, getSessionStatus } from "@/lib/api/session";
import type { SessionStatusResponse } from "@/lib/api/types";
import { useSessionCountdown } from "@/lib/hooks/use-session-countdown";
import { useDevice } from "@/lib/hooks/use-device";
import { toast } from "@/lib/toast";

import { VncCanvas, type ConnectionStage } from "./vnc-canvas";
import { SessionSidebar } from "./session-sidebar";
import { SessionHeader } from "./session-header";
import { SessionFooter } from "./session-footer";
import { SessionLoading } from "./session-loading";
import { SessionDead } from "./session-dead";
import { MobileKeyboard, type MobileKeyboardHandle } from "./mobile-keyboard";
import { GestureHints } from "./gesture-hints";
import { PrivacyNotice } from "./privacy-notice";
import { useSessionPoll } from "./use-session-poll";
import type RFB from "@novnc/novnc";

interface StreamPlayerProps {
  sessionId: string;
  token?: string | null;
}

export function StreamPlayer({ sessionId, token }: StreamPlayerProps) {
  const [status, setStatus] = useState<SessionStatusResponse | null>(null);
  const [rfbConnected, setRfbConnected] = useState(false);
  const [destroying, setDestroying] = useState(false);
  const [deadReason, setDeadReason] = useState<"destroyed" | "not_found">("destroyed");
  const [stage, setStage] = useState<ConnectionStage>("loading");
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [rfbGen, setRfbGen] = useState(0);
  const destroySentRef = useRef(false);
  const rfbRef = useRef<RFB | null>(null);
  const keyboardRef = useRef<MobileKeyboardHandle>(null);

  const device = useDevice();
  const countdown = useSessionCountdown(status?.remaining_seconds ?? null);
  const isReady = status?.status === "ready";
  const isDead = status?.status === "dead";
  const totalSeconds = status?.remaining_seconds ?? 0;

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
          setStatus((p) => (p ? { ...p, status: "dead" } : p));
          setRfbConnected(false);
        } else {
          setStatus(s);
        }
      } catch { /* */ }
      finally { if (!cancelled) setExpiryGrace(false); }
    })();
    return () => { cancelled = true; };
  }, [expiryGrace, sessionId]);

  useEffect(() => {
    const ch = new BroadcastChannel(`cleanroom-session-${sessionId}`);
    ch.onmessage = (e) => {
      if (e.data === "destroyed") {
        setStatus((p) => (p ? { ...p, status: "dead" } : p));
        setRfbConnected(false);
        setDeadReason("destroyed");
      }
    };
    return () => ch.close();
  }, [sessionId]);

  useEffect(() => {
    if (isDead) {
      try {
        sessionStorage.removeItem(`session_token_${sessionId}`);
        localStorage.removeItem(`session_token_${sessionId}`);
      } catch {}
    }
  }, [isDead, sessionId]);

  useEffect(() => {
    if (!isReady) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [isReady]);

  const onStatus = useCallback((s: SessionStatusResponse) => setStatus(s), []);
  const onDead = useCallback(() => {
    setStatus((p) => (p ? { ...p, status: "dead" } : p));
    setRfbConnected(false);
  }, []);
  const onNotFound = useCallback(() => {
    setDeadReason("not_found");
    setStatus({ session_id: sessionId, status: "dead", age_seconds: 0, expires_at: null, remaining_seconds: 0 });
  }, [sessionId]);
  useSessionPoll({ sessionId, onStatus, onDead, onNotFound });

  const handleDestroy = useCallback(async () => {
    if (destroySentRef.current) return;
    destroySentRef.current = true;
    setDestroying(true);
    setRfbConnected(false);
    try {
      if (!token) {
        toast.error("No session token");
        destroySentRef.current = false;
        setDestroying(false);
        return;
      }
      await deleteSession(sessionId, token);
      setStatus((p) => (p ? { ...p, status: "dead" } : null));
      toast.success("Session destroyed.");
      try {
        const ch = new BroadcastChannel(`cleanroom-session-${sessionId}`);
        ch.postMessage("destroyed");
        ch.close();
      } catch {}
      setDestroying(false);
    } catch (err: unknown) {
      try {
        const s = await getSessionStatus(sessionId);
        if (s.status === "dead") {
          setStatus((p) => (p ? { ...p, status: "dead" } : null));
          toast.success("Session destroyed.");
          setDestroying(false);
          return;
        }
      } catch { /* */ }
      destroySentRef.current = false;
      setDestroying(false);
      toast.error(err instanceof Error ? err.message : "Failed to destroy session");
    }
  }, [sessionId, token]);

  const onVncConnect = useCallback(() => setRfbConnected(true), []);
  const onVncDisconnect = useCallback(() => setRfbConnected(false), []);
  const onRfbRef = useCallback((rfb: RFB | null) => {
    rfbRef.current = rfb;
    setRfbGen((g) => g + 1);
  }, []);
  const onStageChange = useCallback((s: ConnectionStage) => setStage(s), []);

  const handleToggleSidebar = useCallback(() => {
    setSidebarVisible((v) => !v);
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }, []);

  if (!status || status.status === "creating") return <SessionLoading />;
  if (isDead) return <SessionDead reason={deadReason} />;

  if (isReady && !token) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-60px)]">
        <div className="text-center max-w-md px-5">
          <div className="text-error text-sm font-bold tracking-[0.15em] uppercase mb-2">
            Missing session token
          </div>
          <div className="text-white-mid text-xs leading-[1.75]">
            No authentication token found. Rejoin from the queue or payment page.
          </div>
        </div>
      </div>
    );
  }

  if (isReady) {
    return (
      <div className="fixed inset-0 top-[60px] z-30 bg-void">
        <VncCanvas
          sessionId={sessionId}
          token={token ?? null}
          onConnect={onVncConnect}
          onDisconnect={onVncDisconnect}
          onReconnectFailed={onNotFound}
          onRfbRef={onRfbRef}
          onStageChange={onStageChange}
        />

        <SessionHeader
          sessionId={sessionId}
          connected={rfbConnected}
          countdown={countdown.display}
          critical={countdown.isCritical}
          onToggleSidebar={handleToggleSidebar}
          sidebarVisible={sidebarVisible}
          onToggleFullscreen={handleToggleFullscreen}
        />

        <SessionFooter
          countdown={countdown.display}
          remainingSeconds={countdown.remainingSeconds}
          totalSeconds={totalSeconds}
          critical={countdown.isCritical}
        />

        <SessionSidebar
          rfbRef={rfbRef}
          keyboardRef={keyboardRef}
          onDestroy={handleDestroy}
          destroying={destroying}
          countdown={countdown.display}
          critical={countdown.isCritical}
          rfbGen={rfbGen}
        />

        <MobileKeyboard ref={keyboardRef} rfbRef={rfbRef} />

        {device.isTouch && <GestureHints />}

        <PrivacyNotice />

        {stage !== "connected" && stage !== "disconnected" && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-void/80">
            <div className="text-center">
              <div className="w-5 h-5 border-2 border-green/40 border-t-green rounded-full animate-spin mx-auto mb-2" />
              <div className="text-[10px] text-white-dim uppercase tracking-[0.15em]">
                {stage === "loading" && "Loading viewer"}
                {stage === "connecting" && "Connecting"}
                {stage === "initializing" && "Initializing"}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-60px)]">
      <div className="text-green text-sm font-bold tracking-[0.15em] uppercase">
        {status.status === "destroying" ? "Destroying session" : "Loading"}
      </div>
    </div>
  );
}
