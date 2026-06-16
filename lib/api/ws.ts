import type { QueueWSServerMessage, QueueWSClientMessage, StreamInputEvent } from "./types";

export const WS_BASE = (typeof window !== "undefined" ? (process.env.NEXT_PUBLIC_WS_URL || "wss://api.getcleanroom.xyz") : "");

export const VAPID_KEY_URL = (typeof window !== "undefined"
  ? (process.env.NEXT_PUBLIC_API_URL || "https://api.getcleanroom.xyz")
  : "") + "/api/push/vapid-key";

export function connectQueueWS(session_request_id: string): WebSocket {
  const ws = new WebSocket(`${WS_BASE}/api/queue/ws`);

  ws.onopen = () => {
    ws.send(JSON.stringify({ session_request_id } satisfies QueueWSClientMessage));
  };

  return ws;
}

export function sendQueueHeartbeat(ws: WebSocket) {
  ws.send(JSON.stringify({ type: "heartbeat" } satisfies QueueWSClientMessage));
}

export function parseQueueMessage(data: string): QueueWSServerMessage {
  return JSON.parse(data) as QueueWSServerMessage;
}

export function connectStreamWS(sessionId: string): WebSocket {
  return new WebSocket(`${WS_BASE}/stream/${sessionId}`);
}

export function sendTap(
  ws: WebSocket,
  x: number,
  y: number,
  screenWidth = 720,
  screenHeight = 1280
) {
  ws.send(JSON.stringify({
    type: "tap",
    x,
    y,
    screen_width: screenWidth,
    screen_height: screenHeight,
  } satisfies StreamInputEvent));
}

export function sendKey(ws: WebSocket, keycode: number) {
  ws.send(JSON.stringify({ type: "key", keycode } satisfies StreamInputEvent));
}

export function sendText(ws: WebSocket, text: string) {
  ws.send(JSON.stringify({ type: "text", text } satisfies StreamInputEvent));
}

export function sendPing(ws: WebSocket) {
  ws.send(JSON.stringify({ type: "ping" } satisfies StreamInputEvent));
}
