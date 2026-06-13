"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { joinQueue, confirmSession } from "@/lib/api/queue";
import { connectQueueWS, sendQueueHeartbeat, parseQueueMessage } from "@/lib/api/ws";
import { getToken } from "@/lib/token-storage";
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
  const [wsConnected, setWsConnected] = useState(false);
  const [slotExpiresAt, setSlotExpiresAt] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const hbRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { display: countdownDisplay, expired: slotExpired } = useSlotCountdown(slotExpiresAt);

  const cleanupWS = useCallback(() => {
    if (hbRef.current) { clearInterval(hbRef.current); hbRef.current = null; }
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    setWsConnected(false);
  }, []);

  useEffect(() => {
    if (!token) {
      router.replace("/payment");
      return;
    }

    let cancelled = false;

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
        if (cancelled) return;
        if (pushSub) setPushEnabled(true);
        setJoinData(data);
        setPosition(data.position);
        setTotalCount(data.position + data.waiting_count);
        setLoading(false);

        const ws = connectQueueWS(data.session_request_id);
        wsRef.current = ws;

        ws.onopen = () => setWsConnected(true);
        ws.onclose = () => setWsConnected(false);
        ws.onmessage = (event) => {
          if (cancelled) return;
          const msg = parseQueueMessage(event.data) as QueueWSServerMessage;
          switch (msg.type) {
            case "position":
              setPosition(msg.position);
              setQueueStatus(msg.status);
              break;
            case "heartbeat_ack":
              break;
            case "slot_open":
              setQueueStatus("slot_assigned");
              setSlotExpiresAt(msg.slot_expires_at);
              break;
            case "error":
              setError(msg.message);
              break;
          }
        };

        hbRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            sendQueueHeartbeat(wsRef.current);
          }
        }, 30000);

      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to join queue");
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      cleanupWS();
    };
  }, [token, router, cleanupWS]);

  const handleConfirm = async () => {
    if (!joinData) return;
    setConfirming(true);
    try {
      const session = await confirmSession(joinData.session_request_id);
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
          <div className="mb-6 p-3 border border-error/30 bg-error/10 text-error text-xs clip-cut-tr">
            {error}
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
              <div className="dot-pulse shrink-0" />
              <span className="flex-1">{wsConnected ? "Live queue connection active" : "Disconnected"}</span>
              <Badge variant={wsConnected ? "live" : "waiting"} className="text-[10px]">
                {wsConnected ? "WS" : "OFF"}
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
      <QueuePageContent />
    </Suspense>
  );
}
