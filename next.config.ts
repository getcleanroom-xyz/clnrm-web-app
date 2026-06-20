import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  /**
   * Proxy all API calls through the Next.js server.
   *
   * This makes every API call same-origin from the browser's perspective,
   * eliminating CORS for all HTTP requests entirely. The rewrite is
   * server-side only — the browser never sees the cross-origin request.
   *
   * Routes proxied:
   *   /api/*     → backend /api/*     (all REST + WebSocket endpoints)
   *   /health    → backend /health    (used by getHealth())
   *   /metrics   → backend /metrics   (used by getMetrics())
   *
   * WebSocket connections (queue WS at /api/queue/ws, stream at /stream/*)
   * cannot be proxied by Next.js static rewrites and connect to the API
   * server directly; the backend's CORS config handles those.
   */
  async rewrites() {
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL ?? "https://api.getcleanroom.xyz";
    return [
      {
        source: "/api/:path*",
        destination: `${apiBase}/api/:path*`,
      },
      {
        source: "/health",
        destination: `${apiBase}/health`,
      },
      {
        source: "/metrics",
        destination: `${apiBase}/metrics`,
      },
    ];
  },

  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
      ],
    },
  ],
};

export default nextConfig;
