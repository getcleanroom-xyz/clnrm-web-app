import { get, post } from "./client";
import type { CreateSessionResponse, SessionStatusResponse, HealthResponse, SystemMetrics } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.getcleanroom.xyz";

export async function deleteSession(sessionId: string, token: string, signal?: AbortSignal) {
  const res = await fetch(`${BASE_URL}/sessions/${sessionId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`Failed to delete session: ${res.status}`);
  }
}

export function getHealth(signal?: AbortSignal) {
  return get<HealthResponse>("/health", signal);
}

export function getMetrics(signal?: AbortSignal) {
  return get<SystemMetrics>("/metrics", signal);
}

export function createSessionLegacy(token: string, signal?: AbortSignal) {
  return post<CreateSessionResponse>("/sessions", null, signal);
}

export function getSessionStatus(sessionId: string, signal?: AbortSignal) {
  return get<SessionStatusResponse>(`/sessions/${sessionId}`, signal);
}
