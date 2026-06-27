/**
 * Base HTTP client for the CleanRoom API.
 *
 * All /api/* requests go through the Next.js rewrite proxy (next.config.ts),
 * so they are same-origin from the browser's perspective — no CORS headers
 * are needed for HTTP calls. Only WebSocket connections (queue WS, stream)
 * bypass the proxy and connect to the API server directly.
 *
 * We intentionally use a relative base ("") so that:
 *   - In the browser:  fetch("/api/...") → proxied by Next.js → API server
 *   - In SSR/tests:    the NEXT_PUBLIC_API_URL env var is used as a fallback
 */
const BASE_URL =
  typeof window !== "undefined"
    ? "" // browser: relative → proxied same-origin by Next.js rewrites
    : (process.env.NEXT_PUBLIC_API_URL ?? "https://api.getcleanroom.xyz");

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    // same-origin: cookies/auth are sent for same-origin requests (via proxy)
    // but not for cross-origin requests (WS connections handle auth via token)
    credentials: "same-origin",
    // Never cache API responses — stale 404s from previous sessions cause
    // "SESSION NOT FOUND" on fresh sessions.
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    let code = "unknown";
    let message = res.statusText;
    try {
      const body = await res.json();
      // FastAPI wraps errors in {detail: {error, message}}
      const detail = body.detail || body;
      code = detail.error || code;
      message = detail.message || message;
    } catch {}
    throw new ApiError(res.status, code, message);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  return request<T>(path, { method: "GET", signal });
}

export function post<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
    signal,
  });
}

export function del<T>(path: string, headers?: Record<string, string>, signal?: AbortSignal): Promise<T> {
  return request<T>(path, {
    method: "DELETE",
    headers,
    signal,
  });
}
