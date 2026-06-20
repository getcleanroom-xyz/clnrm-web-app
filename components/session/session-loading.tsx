"use client";

import { Spinner } from "@phosphor-icons/react";

export function SessionLoading() {
  return (
    <div className="relative min-h-[calc(100vh-60px)] flex items-center justify-center">
      <div className="absolute inset-0 pointer-events-none grid-bg-sm" />
      <div className="relative z-10 text-center">
        <Spinner size={32} weight="bold" className="text-green animate-spin mx-auto mb-4" />
        <div className="text-green text-sm font-bold tracking-[0.15em] uppercase">Starting session...</div>
        <div className="text-white-mid text-xs mt-2">Preparing your browser</div>
      </div>
    </div>
  );
}
