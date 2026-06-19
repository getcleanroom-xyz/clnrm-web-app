import { get, del } from "./client";
import type { SessionStatusResponse } from "./types";

export async function deleteSession(sessionId: string, token: string, signal?: AbortSignal) {
  await del<void>(`/api/sessions/${sessionId}`, { Authorization: `Bearer ${token}` }, signal);
}

export function getSessionStatus(sessionId: string, signal?: AbortSignal) {
  return get<SessionStatusResponse>(`/api/sessions/${sessionId}`, signal);
}
