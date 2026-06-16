import { get, post } from "./client";
import type {
  JoinRequest,
  JoinResponse,
  HeartbeatRequest,
  HeartbeatResponse,
  StatusResponse,
  ConfirmRequest,
  ConfirmResponse,
} from "./types";

export function joinQueue(token: string, push_subscription?: string | null, signal?: AbortSignal) {
  return post<JoinResponse>("/api/queue/join", { token, push_subscription } satisfies JoinRequest, signal);
}

export function heartbeat(session_request_id: string, signal?: AbortSignal) {
  return post<HeartbeatResponse>("/api/queue/heartbeat", { session_request_id } satisfies HeartbeatRequest, signal);
}

export function getQueueStatus(session_request_id: string, signal?: AbortSignal) {
  return get<StatusResponse>(`/api/queue/status?session_request_id=${encodeURIComponent(session_request_id)}`, signal);
}

export function confirmSession(session_request_id: string, signal?: AbortSignal) {
  return post<ConfirmResponse>("/api/queue/confirm", { session_request_id } satisfies ConfirmRequest, signal);
}

export function declineSession(session_request_id: string, signal?: AbortSignal) {
  return post<{ session_request_id: string; status: string; position: number }>(
    "/api/queue/decline",
    { session_request_id },
    signal
  );
}
