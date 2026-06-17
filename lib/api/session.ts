import { get, del } from "./client";
import type { SessionStatusResponse, HealthResponse, SystemMetrics } from "./types";

export async function deleteSession(sessionId: string, token: string, signal?: AbortSignal) {
  await del<void>(`/sessions/${sessionId}`, { Authorization: `Bearer ${token}` }, signal);
}

export function getHealth(signal?: AbortSignal) {
  return get<HealthResponse>("/health", signal);
}

export function getMetrics(signal?: AbortSignal) {
  return get<SystemMetrics>("/metrics", signal);
}

export function getSessionStatus(sessionId: string, signal?: AbortSignal) {
  return get<SessionStatusResponse>(`/sessions/${sessionId}`, signal);
}
