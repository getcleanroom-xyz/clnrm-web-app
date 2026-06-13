"use client";

import { useEnvCheck } from "@/lib/hooks/use-env-check";

export function EnvBanner() {
  const { reachable, checking } = useEnvCheck();

  if (checking || reachable) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] bg-error/10 border-b border-error/30 py-1.5 px-4 text-center text-[10px] text-error tracking-[0.15em] uppercase"
      role="alert"
      aria-live="polite"
    >
      Backend unreachable — some features may be unavailable
    </div>
  );
}
