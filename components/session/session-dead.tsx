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

      <div className="relative z-10 text-center max-w-md px-5">
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
