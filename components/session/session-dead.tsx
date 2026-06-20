"use client";

import { WarningCircle, ArrowCircleLeft } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

interface SessionDeadProps {
  reason?: "destroyed" | "not_found";
}

export function SessionDead({ reason = "destroyed" }: SessionDeadProps) {
  const router = useRouter();
  const title = reason === "not_found" ? "Session not found" : "Session ended";
  const message = reason === "not_found"
    ? "This session does not exist or has already been cleaned up."
    : "This session has been destroyed. All data has been wiped and cannot be recovered.";

  return (
    <div className="relative min-h-[calc(100vh-60px)] flex items-center justify-center">
      <div className="absolute inset-0 pointer-events-none grid-bg-sm" />
      <div className="relative z-10 text-center max-w-md">
        <WarningCircle size={48} weight="bold" className="text-error mx-auto mb-4" />
        <div className="text-error text-sm font-bold tracking-[0.15em] uppercase mb-2">{title}</div>
        <div className="text-white-mid text-xs leading-[1.75] mb-6">{message}</div>
        <button
          onClick={() => router.push("/")}
          className="clip-spell inline-flex items-center gap-1.5 border border-green/40 text-green text-xs font-bold tracking-[0.15em] uppercase px-6 py-3 transition-all hover:bg-green-dim/30"
        >
          <ArrowCircleLeft size={14} />
          Return home
        </button>
      </div>
    </div>
  );
}
