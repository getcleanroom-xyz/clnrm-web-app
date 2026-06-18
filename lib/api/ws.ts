import type { QueueWSServerMessage, QueueWSClientMessage } from "./types";

export const WS_BASE =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_WS_URL ?? "wss://api.getcleanroom.xyz"
    : "";

export const API_BASE =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL ?? "https://api.getcleanroom.xyz"
    : "";

export const VAPID_KEY_URL = `${API_BASE}/api/push/vapid-key`;

// ── Queue WebSocket helpers ──

export function sendQueueHeartbeat(ws: WebSocket) {
  ws.send(JSON.stringify({ type: "heartbeat" } satisfies QueueWSClientMessage));
}

export function parseQueueMessage(data: string): QueueWSServerMessage {
  return JSON.parse(data) as QueueWSServerMessage;
}
