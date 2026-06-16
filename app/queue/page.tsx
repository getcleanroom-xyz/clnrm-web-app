"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { joinQueue, confirmSession } from "@/lib/api/queue";
import { parseQueueMessage, WS_BASE } from "@/lib/api/ws";
import { useReconnectingWS } from "@/lib/hooks/use-reconnecting-ws";
import { ErrorBoundary } from "@/components/error-boundary";
import type { JoinResponse, QueueWSServerMessage } from "@/lib/api/types";
import { Bell, BellRinging, Spinner, ArrowRight } from "@phosphor-icons/react";

const VAPID_KEY_URL =
  process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/push/vapid-key`
    : "https://api.getcleanroom.xyz/api/push/vapid-key";

async function getVapidPublicKey(): Promise<string | null> {
  try {
    const res = await fetch(VAPID_KEY_URL);
    if (!res.ok) return null;
    const data = await res.json();
    return data.public_key || null;
  } catch {
    return null;
  }
}

async function subscribePush(vapidKey: string): Promise<string | null> {
  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    const sub = await reg.pushManager.subscribe({
      applicationServerKey: vapidKey,
      userVisibleOnly: true,
    });
    return JSON.stringify(sub.toJSON());
  } catch {
    return null;
  }
}

function useSlotCountdown(expiresAt: string | null) {
  const [display, setDisplay] = useState("--:--");
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!expiresAt) return;
    const deadline = new Date(expiresAt).getTime();

    function tick() {
      const diff = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
      const m = Math.floor(diff / 60);
      const s = diff % 60;
      setDisplay(`${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
      if (diff <= 0) setExpired(true);
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return { display, expired };
}

function formatWait(seconds: number | null): string {
  if (seconds === null) return "~-- min";
  const m = Math.ceil(seconds / 60);
  if (m <= 1) return "~1 min";
  return `~${m} min`;
}

function QueuePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [joinData, setJoinData] = useState<JoinResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [position, setPosition] = useState<number>(0);
  const [totalCount, setTotalCount] = useState(0);
  const [queueStatus, setQueueStatus] = useState<string>("waiting");
  const [slotExpiresAt, setSlotExpiresAt] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const srIdRef = useRef<string | null>(null);
  const cancelledRef = useRef(false);
  const srIdSentRef = useRef(false);
  const { display: countdownDisplay, expired: slotExpired } = useSlotCountdown(slotExpiresAt);
  const [wsUrl, setWsUrl] = useState<string | null>(null);

  const { isConnected, retryCount, send, disconnect: disconnectWS } = useReconnectingWS(wsUrl, {
    onMessage: useCallback((event: MessageEvent) => {
      if (cancelledRef.current) return;
      const msg = parseQueueMessage(event.data) as QueueWSServerMessage;
      switch (msg.type) {
        case "position":
          setPosition(msg.position);
          setQueueStatus(msg.status);
          break;
        case "slot_open":
          setQueueStatus("slot_assigned");
          setSlotExpiresAt(msg.slot_expires_at);
          break;
        case "error":
          setError(msg.message);
          break;
      }
    }, []),
    maxRetries: 20,
    baseDelay: 1000,
    maxDelay: 15000,
  });

  // Send session_request_id on connect and after reconnects
  useEffect(() => {
    if (!isConnected) {
      srIdSentRef.current = false;
      return;
    }
    const srId = srIdRef.current;
    if (srId && !srIdSentRef.current) {
      srIdSentRef.current = true;
      send(JSON.stringify({ session_request_id: srId }));
    }
  }, [isConnected, send]);

  // Heartbeat every 30s while connected
  useEffect(() => {
    if (!isConnected) return;
    const id = setInterval(() => {
      send(JSON.stringify({ type: "heartbeat" }));
    }, 30000);
    return () => clearInterval(id);
  }, [isConnected, send]);

  useEffect(() => {
    if (!token) {
      return;
    }

    cancelledRef.current = false;

    async function init() {
      try {
        let pushSub: string | null = null;
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          const vapidKey = await getVapidPublicKey();
          if (vapidKey) {
            pushSub = await subscribePush(vapidKey);
          }
        }

        const data = await joinQueue(token!, pushSub || undefined);
        if (cancelledRef.current) return;
        if (pushSub) setPushEnabled(true);
        srIdRef.current = data.session_request_id;
        setJoinData(data);
        setPosition(data.position);
        setTotalCount(data.position + data.waiting_count);
        setWsUrl(`${WS_BASE}/api/queue/ws`);
        setLoading(false);
      } catch (err: unknown) {
        if (!cancelledRef.current) {
          setError(err instanceof Error ? err.message : "Failed to join queue");
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      cancelledRef.current = true;
      disconnectWS();
    };
  }, [token, router, disconnectWS]);

  const handleConfirm = async () => {
    if (!joinData) return;
    setConfirming(true);
    try {
      const session = await confirmSession(joinData.session_request_id);
      if (session.adb_port != null) {
        try {
          sessionStorage.setItem(
            `adb_${session.session_id}`,
            JSON.stringify({ adb_port: session.adb_port })
          );
        } catch {}
      }
      router.push(`/session/${session.session_id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to confirm session");
      setConfirming(false);
    }
  };

  const handleDecline = () => {
    setQueueStatus("waiting");
    setSlotExpiresAt(null);
  };

  const requestPush = async () => {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return;
    const vapidKey = await getVapidPublicKey();
    if (!vapidKey) return;
    const sub = await subscribePush(vapidKey);
    if (sub) setPushEnabled(true);
  };

  if (!token) {
    return (
      <div className="relative min-h-[calc(100vh-60px)] flex items-center justify-center px-5">
        <div className="text-center max-w-sm">
          <div className="text-lg font-bold text-white-dim mb-2">No token</div>
          <p className="text-xs text-white-dim leading-relaxed mb-6">
            A session token is required to join the queue. You get one after
            completing payment.
          </p>
          <button
            onClick={() => router.push("/payment")}
            className="inline-flex items-center gap-1.5 bg-green-dim/30 border border-green/40 text-green text-xs font-bold tracking-[0.15em] uppercase px-5 py-2.5 transition-all hover:bg-green-dim/50"
          >
            Get a token
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="relative min-h-[calc(100vh-60px)] flex items-center justify-center">
        <div className="flex items-center gap-3 text-white-mid">
          <Spinner size={18} className="animate-spin" />
          <span className="text-xs tracking-[0.15em] uppercase">Joining queue...</span>
        </div>
      </div>
    );
  }

  const maxPosition = Math.max(totalCount, position + 1);
  const progressPct = queueStatus === "slot_assigned" ? 100 : ((maxPosition - position) / maxPosition) * 100;

  return (
    <div className="relative min-h-[calc(100vh-60px)] py-12 px-5 md:px-12 overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 55% 40% at 50% 50%, rgba(0,59,15,0.18) 0%, transparent 65%)",
        }}
      />

      <div className="max-w-[1100px] mx-auto relative z-10">
        <div className="section-label mb-5">Waiting room</div>

        {error && (
          <div className="mb-6 p-3 border border-error/30 bg-error/10 text-error text-xs">
            <p>{error}</p>
            <button
              onClick={() => { setError(null); setLoading(true); window.location.reload(); }}
              className="mt-2 text-[10px] tracking-[0.1em] uppercase text-error/70 hover:text-error underline"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5 items-start">
          {/* LEFT: position panel */}
          <div>
            <div
              className="bg-surface border border-green/10 p-12 text-center relative overflow-hidden"
              style={{ clipPath: "polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 24px 100%, 0 calc(100% - 24px))" }}
            >
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(0,255,65,0.05) 0%, transparent 65%)" }}
              />

              {queueStatus !== "slot_assigned" ? (
                <>
                  <div className="text-[11px] tracking-[0.25em] uppercase text-white-dim mb-3">Your position</div>
                  <div
                    className="text-[120px] font-bold text-green leading-none [text-shadow:0_0_80px_rgba(0,255,65,0.3)] relative z-10 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                    key={position}
                  >
                    {position}
                  </div>
                  <div className="text-sm text-white-mid my-2">
                    of {totalCount} in line
                  </div>
                  <div className="max-w-[320px] mx-auto">
                    <div
                      className="h-0.5 bg-white-dim/10 mb-2"
                      style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 4px 100%, 0 calc(100% - 4px))" }}
                    >
                      <div
                        className="h-full bg-green shadow-[0_0_10px_#00FF41] transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-white-dim">
                      <span>estimated wait</span>
                      <span>{formatWait(joinData?.estimated_wait_seconds ?? null)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="section-label justify-center mb-5">Slot open</div>
                  <p className="text-xs text-white-mid leading-[1.75] mb-5 max-w-[400px] mx-auto">
                    A session is ready for you. Confirm to start. You have 10 minutes.
                  </p>
                  <div className="text-[56px] font-bold text-green italic leading-none [text-shadow:0_0_40px_rgba(0,255,65,0.4)]">
                    {slotExpired ? "00:00" : countdownDisplay}
                  </div>
                  <div className="text-xs tracking-[0.15em] uppercase text-white-dim mt-2 mb-7">
                    remaining
                  </div>
                  {slotExpired ? (
                    <div className="text-xs text-error">Slot window expired. Please rejoin.</div>
                  ) : (
                    <div className="flex gap-3 justify-center flex-wrap">
                      <button
                        onClick={handleDecline}
                        className="clip-spell inline-flex items-center gap-1.5 border border-white-dim/30 text-white-mid text-xs font-bold tracking-[0.15em] uppercase px-4 py-2 transition-all hover:border-white-dim/60 hover:text-foreground"
                      >
                        Not now
                      </button>
                      <button
                        onClick={handleConfirm}
                        disabled={confirming}
                        className="clip-spell inline-flex items-center gap-1.5 bg-green-dim/30 border border-green/40 text-green text-sm font-bold tracking-[0.15em] uppercase px-9 py-3.5 transition-all hover:bg-green-dim/50 hover:border-green disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {confirming ? (
                          <><Spinner size={16} className="animate-spin" /> Starting...</>
                        ) : (
                          <>Start my session <ArrowRight size={16} /></>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {queueStatus === "slot_assigned" && (
              <div
                className="mt-4 p-3 border border-green/10 bg-green/[0.02] flex items-start gap-3 clip-cut-tr"
                style={{ background: "rgba(0,59,15,0.3)" }}
              >
                <div className="w-0.5 shrink-0 self-stretch bg-green" />
                <div>
                  <div className="text-xs font-bold text-green mb-1">Stay on this page</div>
                  <div className="text-[11px] text-white-mid leading-[1.7]">
                    Your position is held while this tab is open. Enable push notifications or save your token to rejoin if you close it.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: sidebar */}
          <div className="flex flex-col gap-4 pt-1">
            {/* WebSocket status */}
            <div
              className="flex items-center gap-2.5 p-3 bg-surface border border-green/7 text-[11px] text-white-mid"
              style={{ clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)" }}
            >
              <div className={`shrink-0 w-1.5 h-1.5 rounded-full ${isConnected ? "bg-green shadow-[0_0_6px_#00FF41]" : "bg-error"}`} />
              <span className="flex-1">
                {isConnected
                  ? "Live queue connection active"
                  : retryCount > 0
                    ? `Reconnecting (${retryCount})...`
                    : "Disconnected"}
              </span>
              <Badge variant={isConnected ? "live" : "waiting"} className="text-[10px]">
                {isConnected ? "WS" : "OFF"}
              </Badge>
            </div>

            {/* Token card */}
            <div
              className="bg-surface border border-green/8 p-6"
              style={{ clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)" }}
            >
              <div className="text-[10px] tracking-[0.22em] uppercase text-green mb-2">Token on file</div>
              <div className="text-[10px] text-green italic tracking-[0.04em] overflow-hidden text-ellipsis whitespace-nowrap mb-3.5">
                {token ? `${token.slice(0, 48)}...` : "---"}
              </div>
              <div className="flex justify-between items-center mb-2">
                <Badge variant="live" className="text-[9px]">valid</Badge>
                <span className="text-[10px] text-white-dim">Expires 24h</span>
              </div>
              <div className="h-px bg-white-dim/6 mb-1.5">
                <div className="h-full bg-green w-[96%]" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-white-dim">{joinData ? `${totalCount} in queue` : "---"}</span>
                <button
                  onClick={() => router.push("/payment")}
                  className="text-[10px] tracking-[0.1em] uppercase text-white-dim hover:text-foreground transition-colors"
                >
                  Use different token
                </button>
              </div>
            </div>

            {/* Push notifications */}
            <div
              className="bg-surface border border-white-dim/6 p-5"
              style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 16px 100%, 0 calc(100% - 16px))" }}
            >
              <div className="text-[10px] tracking-[0.22em] uppercase text-white-dim mb-2">Push notifications</div>
              <p className="text-[11px] text-white-mid leading-[1.75] mb-3.5">
                Close this tab safely. We will notify you when your slot opens &mdash; no email, no account required.
              </p>
              <button
                onClick={requestPush}
                disabled={pushEnabled}
                className="clip-spell w-full text-center inline-flex items-center justify-center gap-1.5 border border-green/30 text-green text-[11px] font-bold tracking-[0.15em] uppercase px-4 py-2.5 transition-all hover:bg-green-dim/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pushEnabled ? <BellRinging size={14} /> : <Bell size={14} />}
                {pushEnabled ? "Notifications enabled" : "Enable push notifications"}
              </button>
            </div>

            {/* Queue snapshot */}
            <div
              className="bg-surface border border-green/7 p-5"
              style={{ clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%)" }}
            >
              <div className="text-[10px] tracking-[0.22em] uppercase text-green mb-4">Queue snapshot</div>
              {Array.from({ length: Math.min(totalCount, 5) }, (_, i) => {
                const pos = i + 1;
                const isYou = pos === position;
                return (
                  <div key={pos} className="flex items-center gap-3 py-2.5 border-b border-white-dim/4 last:border-b-0 text-xs">
                    <span className={`w-6 text-center font-bold shrink-0 ${isYou ? "text-green" : "text-white-dim"}`}>
                      {pos}
                    </span>
                    <div className={`flex-1 h-px ${isYou ? "bg-green/15" : "bg-white-dim/5"}`} />
                    <span className={`text-[11px] ${isYou ? "text-green font-bold" : "text-white-dim"}`}>
                      {isYou ? "You" : `~${formatWait(joinData ? Math.max(1, pos * 150) : null)}`}
                    </span>
                  </div>
                );
              })}
              <div className="text-[10px] text-white-dim mt-3">Positions update in real time</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QueuePage() {
  return (
    <Suspense fallback={
      <div className="relative min-h-[calc(100vh-60px)] flex items-center justify-center">
        <div className="flex items-center gap-3 text-white-mid">
          <Spinner size={18} className="animate-spin" />
          <span className="text-xs tracking-[0.15em] uppercase">Loading...</span>
        </div>
      </div>
    }>
      <ErrorBoundary>
        <QueuePageContent />
      </ErrorBoundary>
    </Suspense>
  );
}
