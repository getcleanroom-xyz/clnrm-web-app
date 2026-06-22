"use client";

import { useEffect, useRef, useCallback } from "react";
import { WS_BASE } from "@/lib/api/ws";
import { toast } from "@/lib/toast";
import type RFB from "@novnc/novnc";

const MAX_RECONNECT = 3;
const BASE_DELAY = 3000;

interface VncCanvasProps {
  sessionId: string;
  token: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onReconnectFailed?: () => void;
}

/**
 * Manages the noVNC RFB connection lifecycle.
 * Connects when mounted, reconnects up to MAX_RECONNECT times on unclean disconnect.
 * Uses a generation counter to prevent concurrent connect() calls from leaking RFB instances.
 */
export function VncCanvas({ sessionId, token, onConnect, onDisconnect, onReconnectFailed }: VncCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rfbRef = useRef<RFB | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const mountedRef = useRef(false);
  const retriesRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasConnectedRef = useRef(false);
  const connectFnRef = useRef<(() => void) | null>(null);
  const generationRef = useRef(0); // guards against concurrent connect() calls
  const cleaningUpRef = useRef(false); // prevents disconnect handler during cleanup

  const cleanup = useCallback(() => {
    cleaningUpRef.current = true;
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (resizeObserverRef.current) { resizeObserverRef.current.disconnect(); resizeObserverRef.current = null; }
    if (rfbRef.current) {
      try { rfbRef.current.disconnect(); } catch { /* */ }
      rfbRef.current = null;
    }
    cleaningUpRef.current = false;
  }, []);

  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);
  const onReconnectFailedRef = useRef(onReconnectFailed);
  useEffect(() => { onConnectRef.current = onConnect; }, [onConnect]);
  useEffect(() => { onDisconnectRef.current = onDisconnect; }, [onDisconnect]);
  useEffect(() => { onReconnectFailedRef.current = onReconnectFailed; }, [onReconnectFailed]);

  const connect = useCallback(() => {
    if (!containerRef.current || !mountedRef.current) return;

    const gen = ++generationRef.current;

    const wsPath = token
      ? `/stream/${sessionId}?token=${encodeURIComponent(token)}`
      : `/stream/${sessionId}`;
    const wsUrl = `${WS_BASE}${wsPath}`;

    import("@novnc/novnc").then(({ default: RFB }) => {
      // Guard: another connect() call superseded this one
      if (gen !== generationRef.current || !mountedRef.current || !containerRef.current) return;
      cleanup();

      const rfb = new RFB(containerRef.current!, wsUrl, {
        shared: true,
      });
      rfb.scaleViewport = true;

      // Force noVNC to re-read container dimensions after flex layout settles.
      const triggerResize = () => {
        if (gen !== generationRef.current) return;
        rfb.scaleViewport = false;
        rfb.scaleViewport = true;
      };
      requestAnimationFrame(() => requestAnimationFrame(triggerResize));

      rfb.addEventListener("connect", () => {
        if (gen !== generationRef.current || !mountedRef.current) return;
        wasConnectedRef.current = true;
        retriesRef.current = 0;
        onConnectRef.current();
      });

      rfb.addEventListener("disconnect", () => {
        // Skip if this disconnect was caused by our own cleanup()
        if (cleaningUpRef.current || gen !== generationRef.current || !mountedRef.current) return;
        onDisconnectRef.current();
        const retries = retriesRef.current;
        if (wasConnectedRef.current && retries < MAX_RECONNECT) {
          retriesRef.current = retries + 1;
          const fn = connectFnRef.current;
          if (fn) timerRef.current = setTimeout(fn, BASE_DELAY * Math.pow(2, retries));
        } else if (wasConnectedRef.current) {
          // Reconnect exhausted
          toast.error("Connection lost. Please refresh the page.");
          onReconnectFailedRef.current?.();
        }
      });

      rfb.addEventListener("credentialsrequired", () => {
        rfb.sendCredentials({ password: "" });
      });

      rfbRef.current = rfb;

      // Re-scale when container resizes
      const observer = new ResizeObserver(() => {
        if (gen !== generationRef.current || !rfbRef.current) return;
        rfbRef.current.scaleViewport = false;
        rfbRef.current.scaleViewport = true;
      });
      observer.observe(containerRef.current!);
      resizeObserverRef.current = observer;
    }).catch((err) => {
      if (gen !== generationRef.current) return;
      console.error("Failed to load noVNC:", err);
      toast.error("Failed to load VNC viewer. Please refresh the page.");
      onDisconnectRef.current();
    });
  }, [sessionId, token, cleanup]);

  // Sync connect function ref outside of render
  useEffect(() => { connectFnRef.current = connect; });

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => { mountedRef.current = false; cleanup(); };
  }, [connect, cleanup]);

  return (
    <div ref={containerRef} className="flex-1 bg-black relative overflow-hidden min-h-0" />
  );
}
