"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { connectStreamWS, sendTap, sendKey, sendPing } from "@/lib/api/ws";
import { Badge } from "@/components/ui/badge";
import { getSessionStatus, deleteSession } from "@/lib/api/session";
import { getToken } from "@/lib/token-storage";
import type { SessionStatusResponse } from "@/lib/api/types";
import { useSessionCountdown } from "@/lib/hooks/use-session-countdown";
import { AdbPanel } from "@/components/session/adb-panel";
import {
  ArrowCircleLeft,
  Keyboard,
  Spinner,
  Clock,
  Stop,
  WarningCircle,
  Download,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

interface StreamPlayerProps {
  sessionId: string;
  adbPort?: number | null;
}

const ANDROID_WIDTH = 720;
const ANDROID_HEIGHT = 1280;

enum NalType {
  NON_IDR = 1,
  IDR = 5,
  SEI = 6,
  SPS = 7,
  PPS = 8,
}

export function StreamPlayer({ sessionId, adbPort }: StreamPlayerProps) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const decoderRef = useRef<VideoDecoder | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const ptsRef = useRef(0);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fpsFrameCountRef = useRef(0);
  const fpsLastUpdateRef = useRef(performance.now());
  const destroySentRef = useRef(false);
  const [fps, setFps] = useState(0);

  const [status, setStatus] = useState<SessionStatusResponse | null>(null);
  const [connected, setConnected] = useState(false);
  const [decoderReady, setDecoderReady] = useState(false);
  const [webCodecsSupported] = useState(() => "VideoDecoder" in globalThis);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [keyboardInput, setKeyboardInput] = useState("");
  const [destroying, setDestroying] = useState(false);

  const countdown = useSessionCountdown(status?.expires_at ?? null);

  // Auto-destroy on expiry
  useEffect(() => {
    if (!countdown.isExpired) return;
    if (destroySentRef.current) return;
    destroySentRef.current = true;
    setStatus((prev) => prev ? { ...prev, status: "dead" } : prev);
    if (wsRef.current) wsRef.current.close();
  }, [countdown.isExpired]);

  useEffect(() => {
    let active = true;
    async function poll() {
      try {
        const s = await getSessionStatus(sessionId);
        if (!active) return;
        setStatus(s);
      } catch {}
    }
    poll();
    const id = setInterval(poll, 2000);
    return () => { active = false; clearInterval(id); };
  }, [sessionId]);

  useEffect(() => {
    if (!webCodecsSupported) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    contextRef.current = ctx;

    const decoder = new VideoDecoder({
      output: (frame) => {
        if (ctx && canvas) {
          canvas.width = frame.displayWidth;
          canvas.height = frame.displayHeight;
          ctx.drawImage(frame, 0, 0);
        }
        frame.close();
        fpsFrameCountRef.current++;
        const elapsed = performance.now() - fpsLastUpdateRef.current;
        if (elapsed >= 1000) {
          setFps(Math.round(fpsFrameCountRef.current / (elapsed / 1000)));
          fpsFrameCountRef.current = 0;
          fpsLastUpdateRef.current = performance.now();
        }
      },
      error: (e) => {
        console.error("VideoDecoder error:", e.message);
      },
    });

    decoder.configure({ codec: "avc1.42E01E" });

    decoderRef.current = decoder;
    setDecoderReady(true);

    return () => {
      decoder.close();
      decoderRef.current = null;
    };
  }, [webCodecsSupported]);

  useEffect(() => {
    if (!decoderReady || !status || status.status !== "ready") return;
    if (wsRef.current) return;

    const ws = connectStreamWS(sessionId);
    wsRef.current = ws;

    ws.binaryType = "arraybuffer";

    ws.onopen = () => {
      setConnected(true);
      pingRef.current = setInterval(() => sendPing(ws), 30000);
    };

    function handleFrame(data: Uint8Array) {
      const decoder = decoderRef.current;
      if (!decoder) return;

      const nalType = data[4] & 0x1F;
      const pts = ptsRef.current;
      ptsRef.current += 16667;

      try {
        const chunk = new EncodedVideoChunk({
          type: nalType === NalType.IDR ? "key" : "delta",
          timestamp: pts,
          duration: 16667,
          data,
        });
        decoder.decode(chunk);
      } catch (e) {
        console.error("Decode error:", e);
      }
    }

    ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        handleFrame(new Uint8Array(event.data));
      } else if (typeof event.data === "string") {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "pong") return;
        } catch {}
      }
    };

    ws.onclose = () => {
      setConnected(false);
      if (pingRef.current) clearInterval(pingRef.current);
      wsRef.current = null;
    };

    return () => {
      ws.close();
      wsRef.current = null;
      if (pingRef.current) clearInterval(pingRef.current);
    };
  }, [decoderReady, status, sessionId]);

  const handleInteraction = useCallback(
    (clientX: number, clientY: number) => {
      const ws = wsRef.current;
      const canvas = canvasRef.current;
      if (!ws || !canvas || ws.readyState !== WebSocket.OPEN) return;

      const rect = canvas.getBoundingClientRect();
      const x = Math.round(
        ((clientX - rect.left) / rect.width) * ANDROID_WIDTH
      );
      const y = Math.round(
        ((clientY - rect.top) / rect.height) * ANDROID_HEIGHT
      );
      sendTap(ws, x, y, ANDROID_WIDTH, ANDROID_HEIGHT);
    },
    []
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      handleInteraction(e.clientX, e.clientY);
    },
    [handleInteraction]
  );

  const handleCanvasTouch = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        handleInteraction(e.touches[0].clientX, e.touches[0].clientY);
      }
    },
    [handleInteraction]
  );

  const handleKeySend = useCallback(() => {
    const ws = wsRef.current;
    if (!ws || !keyboardInput || ws.readyState !== WebSocket.OPEN) return;
    sendKey(ws, parseInt(keyboardInput, 10));
    setKeyboardInput("");
  }, [keyboardInput]);

  const handleDestroy = useCallback(async () => {
    setDestroying(true);
    try {
      const ws = wsRef.current;
      if (ws) ws.close();
      const token = getToken();
      if (token) {
        await deleteSession(sessionId, token);
      }
    } catch {}
    router.push("/");
  }, [sessionId, router]);

  if (!webCodecsSupported) {
    return (
      <div className="min-h-[calc(100vh-60px)] flex items-center justify-center p-5">
        <div className="text-center max-w-md">
          <WarningCircle size={32} className="text-error mx-auto mb-4" />
          <h1 className="text-lg font-bold text-error mb-2">
            Browser not supported
          </h1>
          <p className="text-xs text-white-mid leading-[1.75] mb-4">
            CleanRoom uses the WebCodecs API to decode the H.264 video stream.
            Your browser does not support this API yet.
          </p>
          <div className="flex flex-col gap-2 items-center">
            <a
              href="https://www.google.com/chrome/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-[0.1em] uppercase border border-green/40 text-green hover:bg-green-dim/30 transition-colors clip-spell"
            >
              <Download size={12} />
              Download Chrome 94+
            </a>
            <a
              href="https://www.mozilla.org/firefox/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-[0.1em] uppercase border border-white-dim/30 text-white-dim hover:text-foreground hover:border-white-dim/60 transition-colors clip-spell"
            >
              <Download size={12} />
              Download Firefox 130+
            </a>
          </div>
        </div>
      </div>
    );
  }

  const isReady = status?.status === "ready";
  const isBooting = status?.status === "booting" || status?.status === "creating";
  const isDead = status?.status === "dead" || status?.status === "destroying";

  const countdownColor = countdown.isCritical
    ? "text-[#FF3B3B]"
    : countdown.isWarning
      ? "text-[#D4A02B]"
      : "text-green";

  return (
    <div className="relative flex flex-col min-h-[calc(100vh-60px)] bg-black">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-green/10 bg-void/90 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={handleDestroy}
            disabled={destroying}
            className="text-white-dim hover:text-foreground transition-colors shrink-0"
            aria-label="Close session"
          >
            <ArrowCircleLeft size={18} />
          </button>
          <span className="text-xs tracking-[0.1em] uppercase text-white-dim hidden sm:inline shrink-0">
            Session
          </span>
          <code className="text-[11px] text-green truncate max-w-[120px] sm:max-w-[200px]">
            {sessionId}
          </code>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {isReady && connected && (
            <span
              className={`text-[11px] font-bold tabular-nums flex items-center gap-1.5 ${countdownColor}`}
            >
              <Clock size={12} />
              {countdown.display}
            </span>
          )}
          {isReady && !countdown.isExpired && (
            <Badge variant="live" className="text-[9px]">
              <span className="dot-pulse mr-1.5" />
              Live
            </Badge>
          )}
          {isBooting && (
            <Badge variant="waiting" className="text-[9px] flex items-center gap-1">
              <Spinner size={10} className="animate-spin" />
              Booting
            </Badge>
          )}
        </div>
      </div>

      {/* Warning banners */}
      {isReady && !countdown.isExpired && countdown.isCritical && (
        <div className="flex items-center gap-2 px-4 py-2 bg-error/10 border-b border-error/20 text-error text-[11px]">
          <WarningCircle size={13} weight="fill" />
          <span>
            Less than {countdown.remainingSeconds}s remaining. Session will end
            automatically.
          </span>
        </div>
      )}
      {isReady && !countdown.isExpired && countdown.isWarning && !countdown.isCritical && (
        <div className="flex items-center gap-2 px-4 py-2 bg-[rgba(212,160,43,0.08)] border-b border-[rgba(212,160,43,0.2)] text-[#D4A02B] text-[11px]">
          <WarningCircle size={13} />
          <span>
            About {Math.ceil(countdown.remainingSeconds / 60)} minutes
            remaining.
          </span>
        </div>
      )}

      {/* Canvas / video area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black">
        {!isReady ? (
          <div className="text-center">
            {isBooting ? (
              <>
                <Spinner size={24} className="animate-spin text-green mx-auto mb-3" />
                <div className="text-xs text-white-mid">Booting your session...</div>
                <div className="text-[10px] text-white-dim mt-2">
                  Android is starting up
                </div>
              </>
            ) : isDead || countdown.isExpired ? (
              <div className="text-center">
                <div className="text-lg font-bold text-error mb-2">
                  {countdown.isExpired ? "Session expired" : "Session ended"}
                </div>
                <p className="text-xs text-white-dim mb-4 max-w-xs mx-auto">
                  {countdown.isExpired
                    ? "The session time limit has been reached. Your container has been destroyed."
                    : "The session has been closed."}
                </p>
                <button
                  onClick={() => router.push("/payment")}
                  className="clip-spell inline-flex items-center gap-1.5 bg-green-dim/30 border border-green/40 text-green text-xs font-bold tracking-[0.15em] uppercase px-5 py-2.5 transition-all hover:bg-green-dim/50 hover:border-green"
                >
                  Start new session
                </button>
              </div>
            ) : (
              <>
                <Spinner size={24} className="animate-spin text-white-dim mx-auto mb-3" />
                <div className="text-xs text-white-mid">Waiting for session...</div>
              </>
            )}
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full object-contain cursor-pointer"
            style={{
              aspectRatio: `${ANDROID_WIDTH}/${ANDROID_HEIGHT}`,
              maxHeight: "calc(100vh - 180px)",
            }}
            onClick={handleCanvasClick}
            onTouchStart={handleCanvasTouch}
          />
        )}

        {/* Connection indicator overlay */}
        {isReady && !connected && (
          <div className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-void/80 border border-white-dim/20 text-[10px] text-white-dim">
            <Spinner size={10} className="animate-spin" />
            Connecting...
          </div>
        )}
      </div>

      {/* Bottom toolbar */}
      {isReady && !countdown.isExpired && (
        <div className="border-t border-green/10 bg-void/90 backdrop-blur-sm px-4 py-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowKeyboard(!showKeyboard)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold tracking-[0.1em] uppercase transition-all ${
                showKeyboard
                  ? "bg-green-dim/30 border border-green/40 text-green"
                  : "border border-white-dim/20 text-white-dim hover:border-white-dim/40"
              }`}
            >
              <Keyboard size={12} />
              Keyboard
            </button>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-white-dim">
            <span>FPS: {Math.round(fps)}</span>
          </div>

          <button
            onClick={handleDestroy}
            disabled={destroying}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold tracking-[0.1em] uppercase text-error border border-error/30 transition-all hover:bg-error/10 disabled:opacity-50"
          >
            {destroying ? (
              <Spinner size={12} className="animate-spin" />
            ) : (
              <Stop size={12} />
            )}
            End session
          </button>
        </div>
      )}

      {/* Keyboard input drawer */}
      {showKeyboard && (
        <div className="border-t border-green/10 bg-surface px-4 py-3 shrink-0">
          <div className="flex items-center gap-3 max-w-md mx-auto">
            <input
              type="text"
              value={keyboardInput}
              onChange={(e) => setKeyboardInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleKeySend();
              }}
              placeholder="Android keycode (e.g. 4 for BACK)"
              className="flex-1 h-8 bg-void border border-white-dim/20 px-2.5 text-xs text-foreground outline-none focus:border-green/40 transition-colors placeholder:text-white-dim/30"
            />
            <button
              onClick={handleKeySend}
              className="px-3 py-1.5 text-[10px] font-bold tracking-[0.1em] uppercase bg-green-dim/30 border border-green/40 text-green transition-all hover:bg-green-dim/50"
            >
              Send
            </button>
          </div>
          <div className="flex gap-2 mt-2 justify-center max-w-md mx-auto flex-wrap">
            {[
              { label: "HOME", code: 3 },
              { label: "BACK", code: 4 },
              { label: "APP_SWITCH", code: 187 },
              { label: "ENTER", code: 66 },
              { label: "SPACE", code: 62 },
              { label: "DEL", code: 67 },
            ].map((k) => (
              <button
                key={k.code}
                onClick={() => {
                  const ws = wsRef.current;
                  if (ws) sendKey(ws, k.code);
                }}
                className="px-2.5 py-1 text-[9px] font-bold tracking-[0.1em] uppercase border border-white-dim/15 text-white-dim hover:border-white-dim/30 hover:text-foreground transition-all"
              >
                {k.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ADB Panel */}
      {isReady && !countdown.isExpired && (
        <AdbPanel adbPort={adbPort ?? null} />
      )}
    </div>
  );
}
