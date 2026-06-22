"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { WS_BASE } from "@/lib/api/ws";
import { toast } from "@/lib/toast";
import { useDevice, useNetworkType } from "@/lib/hooks/use-device";
import { GestureHints } from "./gesture-hints";
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
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const mountedRef = useRef(false);
  const retriesRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasConnectedRef = useRef(false);
  const connectFnRef = useRef<(() => void) | null>(null);
  const generationRef = useRef(0);
  const cleaningUpRef = useRef(false);

  const device = useDevice();
  const network = useNetworkType();
  const [stage, setStage] = useState<ConnectionStage>("loading");

  const updateStage = useCallback(
    (s: ConnectionStage) => {
      setStage(s);
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
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }
    if (rfbRef.current) {
      try {
        rfbRef.current.disconnect();
      } catch {
        /* */
      }
      rfbRef.current = null;
      onRfbRef?.(null);
    }
    cleaningUpRef.current = false;
  }, [onRfbRef]);

  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);
  const onReconnectFailedRef = useRef(onReconnectFailed);
  useEffect(() => {
    onConnectRef.current = onConnect;
  }, [onConnect]);
  useEffect(() => {
    onDisconnectRef.current = onDisconnect;
  }, [onDisconnect]);
  useEffect(() => {
    onReconnectFailedRef.current = onReconnectFailed;
  }, [onReconnectFailed]);

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
        if (gen !== generationRef.current || !mountedRef.current || !containerRef.current)
          return;
        cleanup();
        updateStage("connecting");

        const rfb = new RFB(containerRef.current!, wsUrl, { shared: true });

        // ── Device-adaptive settings ──────────────────────────────────
        if (device.isMobile || device.isTablet) {
          rfb.scaleViewport = false;
          rfb.clipViewport = true;
          rfb.dragViewport = true;
          rfb.resizeSession = true;
          rfb.showDotCursor = true;
        } else {
          rfb.scaleViewport = true;
          rfb.clipViewport = false;
          rfb.dragViewport = false;
          rfb.resizeSession = false;
          rfb.showDotCursor = false;
        }

        // Adaptive quality for slow networks
        if (network === "slow") {
          rfb.compressionLevel = 6;
          rfb.qualityLevel = 3;
        } else if (device.isMobile) {
          rfb.compressionLevel = 4;
          rfb.qualityLevel = 5;
        }

        // Force re-scale after flex layout settles (desktop only)
        if (!device.isMobile && !device.isTablet) {
          const triggerResize = () => {
            if (gen !== generationRef.current) return;
            rfb.scaleViewport = false;
            rfb.scaleViewport = true;
          };
          requestAnimationFrame(() => requestAnimationFrame(triggerResize));
        }

        // ── Events ───────────────────────────────────────────────────
        rfb.addEventListener("connect", () => {
          if (gen !== generationRef.current || !mountedRef.current) return;
          wasConnectedRef.current = true;
          retriesRef.current = 0;
          updateStage("connected");
          onConnectRef.current();
        });

        rfb.addEventListener("disconnect", () => {
          if (cleaningUpRef.current || gen !== generationRef.current || !mountedRef.current)
            return;
          updateStage("disconnected");
          onDisconnectRef.current();
          const retries = retriesRef.current;
          if (wasConnectedRef.current && retries < MAX_RECONNECT) {
            retriesRef.current = retries + 1;
            const fn = connectFnRef.current;
            if (fn)
              timerRef.current = setTimeout(
                fn,
                BASE_DELAY * Math.pow(2, retries),
              );
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

        // Re-scale on container resize (desktop only)
        if (!device.isMobile && !device.isTablet) {
          const observer = new ResizeObserver(() => {
            if (gen !== generationRef.current || !rfbRef.current) return;
            rfbRef.current.scaleViewport = false;
            rfbRef.current.scaleViewport = true;
          });
          observer.observe(containerRef.current!);
          resizeObserverRef.current = observer;
        }
      })
      .catch((err) => {
        if (gen !== generationRef.current) return;
        console.error("Failed to load noVNC:", err);
        toast.error("Failed to load VNC viewer. Please refresh the page.");
        updateStage("disconnected");
        onDisconnectRef.current();
      });
  }, [sessionId, token, cleanup, device, network, updateStage, onRfbRef]);

  useEffect(() => {
    connectFnRef.current = connect;
  });

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [connect, cleanup]);

  // Full-screen canvas on mobile, flex-1 on desktop
  const containerClass = device.isMobile
    ? "absolute inset-0 bg-black"
    : "flex-1 bg-black relative overflow-hidden min-h-0";

  return (
    <div className={device.isMobile ? "relative flex-1 min-h-0" : undefined}>
      <div ref={containerRef} className={containerClass} />
      {device.isTouch && <GestureHints />}
      {stage !== "connected" && stage !== "disconnected" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-green/40 border-t-green rounded-full animate-spin mx-auto mb-2" />
            <div className="text-[10px] text-white-mid uppercase tracking-wider">
              {stage === "loading" && "Loading viewer..."}
              {stage === "connecting" && "Connecting..."}
              {stage === "initializing" && "Initializing..."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
