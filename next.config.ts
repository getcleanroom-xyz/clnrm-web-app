import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // @novnc/novnc is an ESM-only package ("type": "module") that accesses
  // browser globals (document, window) at module-evaluation time. Without
  // transpilePackages, Next.js/webpack cannot bundle it correctly and the
  // SSR pre-render will crash silently, preventing RFB from ever mounting.
  transpilePackages: ["@novnc/novnc"],
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
        source: "/stream/:path*",
        destination: `${apiBase}/stream/:path*`,
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
