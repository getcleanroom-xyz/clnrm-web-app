"use client";

import { useEffect, useRef, useCallback } from "react";
import { WS_BASE } from "@/lib/api/ws";
import { toast } from "@/lib/toast";
import { useDevice } from "@/lib/hooks/use-device";
import type RFB from "@novnc/novnc";

const MAX_RECONNECT = 3;
const BASE_DELAY = 3000;

export type ConnectionStage = "loading" | "connecting" | "initializing" | "connected" | "disconnected";

interface VncCanvasProps {
  sessionId: string;
  token: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onReconnectFailed?: () => void;
  onRfbRef?: (rfb: RFB | null) => void;
  onStageChange?: (stage: ConnectionStage) => void;
}

export function VncCanvas({
  sessionId,
  token,
  onConnect,
  onDisconnect,
  onReconnectFailed,
  onRfbRef,
  onStageChange,
}: VncCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rfbRef = useRef<RFB | null>(null);
  const mountedRef = useRef(false);
  const retriesRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasConnectedRef = useRef(false);
  const connectFnRef = useRef<(() => void) | null>(null);
  const generationRef = useRef(0);
  const cleaningUpRef = useRef(false);

  const device = useDevice();

  const updateStage = useCallback(
    (s: ConnectionStage) => {
      onStageChange?.(s);
    },
    [onStageChange],
  );

  const cleanup = useCallback(() => {
    cleaningUpRef.current = true;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (rfbRef.current) {
      try { rfbRef.current.disconnect(); } catch { /* */ }
      rfbRef.current = null;
      onRfbRef?.(null);
    }
    cleaningUpRef.current = false;
  }, [onRfbRef]);

  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);
  const onReconnectFailedRef = useRef(onReconnectFailed);
  useEffect(() => { onConnectRef.current = onConnect; }, [onConnect]);
  useEffect(() => { onDisconnectRef.current = onDisconnect; }, [onDisconnect]);
  useEffect(() => { onReconnectFailedRef.current = onReconnectFailed; }, [onReconnectFailed]);

  const connect = useCallback(() => {
    if (!containerRef.current || !mountedRef.current) return;
    const gen = ++generationRef.current;
    updateStage("loading");

    const wsPath = token
      ? `/stream/${sessionId}?token=${encodeURIComponent(token)}`
      : `/stream/${sessionId}`;
    const wsUrl = `${WS_BASE}${wsPath}`;

    import("@novnc/novnc")
      .then(({ default: RFB }) => {
        if (gen !== generationRef.current || !mountedRef.current || !containerRef.current) return;
        cleanup();
        updateStage("connecting");

        const rfb = new RFB(containerRef.current!, wsUrl, { shared: true });

        // Canvas fills the container; remote desktop resizes to match
        rfb.scaleViewport = true;
        rfb.resizeSession = true;
        rfb.showDotCursor = device.isTouch;

        rfb.addEventListener("connect", () => {
          if (gen !== generationRef.current || !mountedRef.current) return;
          wasConnectedRef.current = true;
          retriesRef.current = 0;
          updateStage("connected");
          onConnectRef.current();
        });

        rfb.addEventListener("disconnect", () => {
          if (cleaningUpRef.current || gen !== generationRef.current || !mountedRef.current) return;
          updateStage("disconnected");
          onDisconnectRef.current();
          const retries = retriesRef.current;
          if (wasConnectedRef.current && retries < MAX_RECONNECT) {
            retriesRef.current = retries + 1;
            const fn = connectFnRef.current;
            if (fn) timerRef.current = setTimeout(fn, BASE_DELAY * Math.pow(2, retries));
          } else if (wasConnectedRef.current) {
            toast.error("Connection lost. Please refresh the page.");
            onReconnectFailedRef.current?.();
          }
        });

        rfb.addEventListener("credentialsrequired", () => {
          rfb.sendCredentials({ password: "" });
        });

        rfbRef.current = rfb;
        onRfbRef?.(rfb);
        updateStage("initializing");
      })
      .catch((err) => {
        if (gen !== generationRef.current) return;
        console.error("Failed to load noVNC:", err);
        toast.error("Failed to load VNC viewer.");
        updateStage("disconnected");
        onDisconnectRef.current();
      });
  }, [sessionId, token, cleanup, device.isTouch, updateStage, onRfbRef]);

  useEffect(() => { connectFnRef.current = connect; });

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => { mountedRef.current = false; cleanup(); };
  }, [connect, cleanup]);

  return (
    <div ref={containerRef} className="absolute inset-0 bg-void" />
  );
}
