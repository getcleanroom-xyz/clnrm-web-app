"use client";

import { useEffect, useRef, useCallback } from "react";
import { WS_BASE } from "@/lib/api/ws";
import type RFB from "@novnc/novnc";

const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_RECONNECT_DELAY = 3000;

interface VncCanvasProps {
  sessionId: string;
  token: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

/**
 * Manages the noVNC RFB connection lifecycle.
 * Dynamically imports @novnc/novnc (can't be top-level in Next.js SSR).
 * Creates an RFB instance on the container div and handles reconnect
 * with exponential backoff, limited to MAX_RECONNECT_ATTEMPTS.
 */
export function VncCanvas({ sessionId, token, onConnect, onDisconnect }: VncCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rfbRef = useRef<RFB | null>(null);
  const mountedRef = useRef(false);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectRef = useRef<(() => void) | null>(null);
  const wasConnectedRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);

  const cleanup = useCallback(() => {
    if (reconnectRef.current) {
      clearTimeout(reconnectRef.current);
      reconnectRef.current = null;
    }
    if (rfbRef.current) {
      try { rfbRef.current.disconnect(); } catch { /* already disconnected */ }
      rfbRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!containerRef.current || !mountedRef.current) return;

    const wsPath = token
      ? `/stream/${sessionId}?token=${encodeURIComponent(token)}`
      : `/stream/${sessionId}`;
    const wsUrl = `${WS_BASE}${wsPath}`;

    // Dynamically import — @novnc/novnc accesses browser globals at load time
    import("@novnc/novnc").then(({ default: RFB }) => {
      if (!mountedRef.current || !containerRef.current) return;
      cleanup();

      const rfb = new RFB(containerRef.current!, wsUrl, {
        shared: true,
        repeaterID: "",
      });

      rfb.scaleViewport = true;
      rfb.resizeSession = true;

      rfb.addEventListener("connect", () => {
        if (!mountedRef.current) return;
        wasConnectedRef.current = true;
        reconnectAttemptsRef.current = 0;
        onConnect();
      });

      rfb.addEventListener("disconnect", (e) => {
        if (!mountedRef.current) return;
        onDisconnect();

        const attempts = reconnectAttemptsRef.current;

        // Reconnect if:
        // 1. Connection was previously established, OR
        // 2. First few attempts (VNC may still be starting up)
        // AND: disconnect was unclean, and we haven't exceeded max retries
        const canRetry = wasConnectedRef.current || attempts < 3;
        if (!e.detail.clean && canRetry && attempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current = attempts + 1;
          const delay = BASE_RECONNECT_DELAY * Math.pow(2, Math.min(attempts, 4));
          reconnectRef.current = setTimeout(connectRef.current!, delay);
        }
      });

      rfb.addEventListener("credentialsrequired", () => {
        rfb.sendCredentials({ password: "" });
      });

      rfbRef.current = rfb;
    });
  }, [sessionId, token, onConnect, onDisconnect, cleanup]);

  // Keep connectRef in sync so the disconnect handler always sees latest connect
  useEffect(() => {
    connectRef.current = connect;
  });

  // Auto-connect when mounted
  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [cleanup, connect]);

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-black relative overflow-hidden"
    />
  );
}
