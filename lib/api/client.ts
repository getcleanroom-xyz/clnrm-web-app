/**
 * Base HTTP client for the CleanRoom API.
 *
 * All /api/* requests go directly to the API server (api.getcleanroom.xyz),
 * NOT through the Next.js rewrite proxy. The proxy is behind Cloudflare's
 * challenge page, which blocks non-browser requests and breaks the API.
 *
 * The backend has CORS configured to allow www.getcleanroom.xyz and
 * api.getcleanroom.xyz, so cross-origin requests work correctly.
 */

/** Single source of truth for the API base URL. */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "https://api.getcleanroom.xyz";

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
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
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
