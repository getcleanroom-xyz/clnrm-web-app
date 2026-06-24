import type { QueueWSServerMessage, QueueWSClientMessage } from "./types";

export const WS_BASE =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_WS_URL
      ?? (location.hostname === "localhost" || location.hostname === "127.0.0.1"
        ? `ws://${location.hostname}:8000`
        : "wss://api.getcleanroom.xyz")
    : "";

export const API_BASE =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL ?? "https://api.getcleanroom.xyz"
    : "";

/**
 * Always use a relative path for the VAPID key URL so that the fetch
 * goes through the Next.js proxy (same-origin) instead of hitting the
 * API server directly (cross-origin → CORS block).
 */
export const VAPID_KEY_URL = "/api/push/vapid-key";

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
