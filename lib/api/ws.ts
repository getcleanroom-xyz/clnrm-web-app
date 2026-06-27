import type { QueueWSServerMessage, QueueWSClientMessage } from "./types";
import { API_BASE } from "./client";

export const WS_BASE =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_WS_URL
      ?? (location.hostname === "localhost" || location.hostname === "127.0.0.1"
        ? `ws://${location.hostname}:8000`
        : "wss://api.getcleanroom.xyz")
    : "";

/**
 * VAPID key URL must go directly to the API server.
 * There is no Next.js proxy configured — relative URLs would 404.
 */
export const VAPID_KEY_URL = `${API_BASE}/api/push/vapid-key`;

// ── Queue WebSocket helpers ──

export function sendQueueHeartbeat(ws: WebSocket) {
  ws.send(JSON.stringify({ type: "heartbeat" } satisfies QueueWSClientMessage));
}

export function parseQueueMessage(data: string): QueueWSServerMessage {
  const parsed = JSON.parse(data);
  if (!parsed || typeof parsed !== "object" || typeof parsed.type !== "string") {
    throw new Error("Invalid queue message: missing type field");
  }
  return parsed as QueueWSServerMessage;
}
