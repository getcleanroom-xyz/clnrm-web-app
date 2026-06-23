"use client";

import { Spinner, Info } from "@phosphor-icons/react";

export function SessionLoading() {
  return (
    <div className="fixed inset-0 z-30 bg-void flex items-center justify-center">
      {/* Grid background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,255,65,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,65,0.025) 1px, transparent 1px)
          `,
          backgroundSize: "56px 56px",
        }}
      />

      {/* Corner accents */}
      <div
        className="absolute top-0 left-0 w-8 h-8 pointer-events-none"
        style={{
          background: "rgba(0,255,65,0.08)",
          clipPath: "polygon(0 0, 100% 0, 0 100%)",
        }}
      />
      <div
        className="absolute top-0 right-0 w-8 h-8 pointer-events-none"
        style={{
          background: "rgba(0,255,65,0.08)",
          clipPath: "polygon(0 0, 100% 0, 100% 100%)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-8 h-8 pointer-events-none"
        style={{
          background: "rgba(0,255,65,0.08)",
          clipPath: "polygon(0 0, 0 100%, 100% 100%)",
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-8 h-8 pointer-events-none"
        style={{
          background: "rgba(0,255,65,0.08)",
          clipPath: "polygon(100% 0, 0 100%, 100% 100%)",
        }}
      />

      <div className="relative z-10 text-center">
        <Spinner size={32} weight="bold" className="text-green animate-spin mx-auto mb-4" />
        <div className="text-green text-sm font-bold tracking-[0.15em] uppercase">Starting session...</div>
        <div className="text-white-mid text-xs mt-2">Preparing your browser</div>

        <div className="mt-8 max-w-xs mx-auto px-4 py-3 border border-green/10"
          style={{ clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))" }}>
          <div className="flex items-start gap-2">
            <Info size={12} weight="bold" className="text-green shrink-0 mt-0.5" />
            <p className="text-[10px] text-white-dim/70 leading-[1.6] text-left">
              Your connection to CleanRoom is visible to your ISP. The browsing
              inside is Tor-routed. For full privacy, connect via VPN or Tor Browser.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
