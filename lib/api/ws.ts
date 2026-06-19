import type { QueueWSServerMessage } from "./types";

export const WS_BASE =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_WS_URL ?? "wss://api.getcleanroom.xyz"
    : "";

/**
 * Always use a relative path for the VAPID key URL so that the fetch
 * goes through the Next.js proxy (same-origin) instead of hitting the
 * API server directly (cross-origin → CORS block).
 */
export const VAPID_KEY_URL = "/api/push/vapid-key";

// ── Queue WebSocket helpers ──

export function parseQueueMessage(data: string): QueueWSServerMessage {
  return JSON.parse(data) as QueueWSServerMessage;
}
