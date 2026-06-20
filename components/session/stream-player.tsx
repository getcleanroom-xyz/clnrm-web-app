"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
  const [destroying, setDestroying] = useState(false);
  const destroySentRef = useRef(false);

  const countdown = useSessionCountdown(status?.expires_at ?? null);
  const isReady = status?.status === "ready";
  const isDead = status?.status === "dead";

  // Poll session status
  useSessionPoll({
    sessionId,
    onStatus: (s) => setStatus(s),
    onDead: () => {
      setStatus((prev) => prev ? { ...prev, status: "dead" } : prev);
      setRfbConnected(false);
    },
  });

  // Auto-destroy on client-side expiry
  useEffect(() => {
    if (!countdown.isExpired) return;
    if (destroySentRef.current) return;
    destroySentRef.current = true;
    setStatus((prev) => prev ? { ...prev, status: "dead" } : prev);
  }, [countdown.isExpired]);

  const handleDestroy = useCallback(async () => {
    if (destroySentRef.current) return;
    destroySentRef.current = true;
    setDestroying(true);
    try {
      await deleteSession(sessionId, token ?? "");
      setStatus((prev) => prev ? { ...prev, status: "dead" } : null);
      setRfbConnected(false);
      toast.success("Session destroyed. All data wiped.");
    } catch (err: unknown) {
      destroySentRef.current = false;
      setDestroying(false);
      toast.error(err instanceof Error ? err.message : "Failed to destroy session");
    }
  }, [sessionId, token]);

  // Render states
  if (!status || status.status === "creating") return <SessionLoading />;
  if (isDead) return <SessionDead />;

  if (isReady) {
    return (
      <div className="relative min-h-[calc(100vh-60px)] flex flex-col">
        <SessionHeader
          connected={rfbConnected}
          expiresAt={status.expires_at}
          countdown={countdown.display}
          onDestroy={handleDestroy}
          destroying={destroying}
        />
        <VncCanvas
          sessionId={sessionId}
          token={token ?? null}
          onConnect={() => setRfbConnected(true)}
          onDisconnect={() => setRfbConnected(false)}
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
