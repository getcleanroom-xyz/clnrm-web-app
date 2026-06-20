"use client";

import { useEffect, useRef, useCallback } from "react";
import { WS_BASE } from "@/lib/api/ws";
import type RFB from "@novnc/novnc";

interface VncCanvasProps {
  sessionId: string;
  token: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

/**
 * Manages the noVNC RFB connection lifecycle.
 * Dynamically imports @novnc/novnc (can't be top-level in Next.js SSR).
 * Creates an RFB instance on the container div.
 *
 * Does NOT auto-reconnect — the backend's _wait_for_vnc handles
 * waiting for websockify to be ready. The frontend connects once
 * when the session becomes ready.
 */
export function VncCanvas({ sessionId, token, onConnect, onDisconnect }: VncCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rfbRef = useRef<RFB | null>(null);
  const mountedRef = useRef(false);

  const cleanup = useCallback(() => {
    if (rfbRef.current) {
      try { rfbRef.current.disconnect(); } catch { /* already disconnected */ }
      rfbRef.current = null;
    }
  }, []);

  // Auto-connect when mounted
  useEffect(() => {
    if (!containerRef.current) return;
    mountedRef.current = true;

    const wsPath = token
      ? `/stream/${sessionId}?token=${encodeURIComponent(token)}`
      : `/stream/${sessionId}`;
    const wsUrl = `${WS_BASE}${wsPath}`;

    // Dynamically import — @novnc/novnc accesses browser globals at load time
    import("@novnc/novnc").then(({ default: RFB }) => {
      if (!mountedRef.current || !containerRef.current) return;

      const rfb = new RFB(containerRef.current!, wsUrl, {
        shared: true,
        repeaterID: "",
      });

      rfb.scaleViewport = true;
      rfb.resizeSession = true;

      rfb.addEventListener("connect", () => {
        if (!mountedRef.current) return;
        onConnect();
      });

      rfb.addEventListener("disconnect", () => {
        if (!mountedRef.current) return;
        onDisconnect();
        // No auto-reconnect — backend handles retry via _wait_for_vnc
      });

      rfb.addEventListener("credentialsrequired", () => {
        rfb.sendCredentials({ password: "" });
      });

      rfbRef.current = rfb;
    }).catch((err) => {
      console.error("Failed to load noVNC:", err);
      onDisconnect();
    });

    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [sessionId, token, onConnect, onDisconnect, cleanup]);

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-black relative overflow-hidden"
    />
  );
}
