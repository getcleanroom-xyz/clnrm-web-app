"use client";

import { Spinner } from "@phosphor-icons/react";

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
      </div>
    </div>
  );
}
