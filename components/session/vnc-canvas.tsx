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
}

/**
 * Manages the noVNC RFB connection lifecycle.
 * Connects when mounted, reconnects up to MAX_RECONNECT times on unclean disconnect.
 */
export function VncCanvas({ sessionId, token, onConnect, onDisconnect }: VncCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rfbRef = useRef<RFB | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const mountedRef = useRef(false);
  const retriesRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasConnectedRef = useRef(false);
  const connectFnRef = useRef<(() => void) | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (resizeObserverRef.current) { resizeObserverRef.current.disconnect(); resizeObserverRef.current = null; }
    if (rfbRef.current) {
      try { rfbRef.current.disconnect(); } catch { /* */ }
      rfbRef.current = null;
    }
  }, []);

  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);
  useEffect(() => { onConnectRef.current = onConnect; }, [onConnect]);
  useEffect(() => { onDisconnectRef.current = onDisconnect; }, [onDisconnect]);

  const connect = useCallback(() => {
    if (!containerRef.current || !mountedRef.current) return;

    const wsPath = token
      ? `/stream/${sessionId}?token=${encodeURIComponent(token)}`
      : `/stream/${sessionId}`;
    const wsUrl = `${WS_BASE}${wsPath}`;

    import("@novnc/novnc").then(({ default: RFB }) => {
      if (!mountedRef.current || !containerRef.current) return;
      cleanup();

      const rfb = new RFB(containerRef.current!, wsUrl, {
        shared: true,
      });
      rfb.scaleViewport = true;

      // Force noVNC to re-read container dimensions after flex layout settles.
      // On connect, the container may not have its final size yet.
      const triggerResize = () => {
        rfb.scaleViewport = false;
        rfb.scaleViewport = true;
      };
      requestAnimationFrame(() => requestAnimationFrame(triggerResize));

      rfb.addEventListener("connect", () => {
        if (!mountedRef.current) return;
        wasConnectedRef.current = true;
        retriesRef.current = 0;
        onConnectRef.current();
      });

      rfb.addEventListener("disconnect", () => {
        if (!mountedRef.current) return;
        onDisconnectRef.current();
        const retries = retriesRef.current;
        if (wasConnectedRef.current && retries < MAX_RECONNECT) {
          retriesRef.current = retries + 1;
          timerRef.current = setTimeout(connectFnRef.current!, BASE_DELAY * Math.pow(2, retries));
        }
      });

      rfb.addEventListener("credentialsrequired", () => {
        rfb.sendCredentials({ password: "" });
      });

      rfbRef.current = rfb;

      // Re-scale when container resizes (e.g., window resize, sidebar toggle)
      const observer = new ResizeObserver(() => {
        if (rfbRef.current) {
          rfbRef.current.scaleViewport = false;
          rfbRef.current.scaleViewport = true;
        }
      });
      observer.observe(containerRef.current!);
      resizeObserverRef.current = observer;
    }).catch((err) => {
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
