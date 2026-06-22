"use client";

import { useState, useRef, useCallback } from "react";
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
  const [deadReason, setDeadReason] = useState<"destroyed" | "not_found">("destroyed");
  const destroySentRef = useRef(false);

  const countdown = useSessionCountdown(status?.remaining_seconds ?? null);
  const isReady = status?.status === "ready";
  const isDead = status?.status === "dead";

  // Poll session status — memoize callbacks to prevent poll timer restarts
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

  const handleDestroy = useCallback(async () => {
    if (destroySentRef.current) return;
    destroySentRef.current = true;
    setDestroying(true);
    try {
      if (!token) {
        toast.error("No session token — cannot destroy");
        destroySentRef.current = false;
        setDestroying(false);
        return;
      }
      await deleteSession(sessionId, token);
      setStatus((prev) => prev ? { ...prev, status: "dead" } : null);
      setRfbConnected(false);
      toast.success("Session destroyed. All data wiped.");
      setDestroying(false);
    } catch (err: unknown) {
      destroySentRef.current = false;
      setDestroying(false);
      toast.error(err instanceof Error ? err.message : "Failed to destroy session");
    }
  }, [sessionId, token]);

  const onVncConnect = useCallback(() => setRfbConnected(true), []);
  const onVncDisconnect = useCallback(() => setRfbConnected(false), []);

  // Render states
  if (!status || status.status === "creating") return <SessionLoading />;
  if (isDead) return <SessionDead reason={deadReason} />;

  if (isReady) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
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
          onConnect={onVncConnect}
          onDisconnect={onVncDisconnect}
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
