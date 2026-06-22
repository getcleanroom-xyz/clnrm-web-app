"use client";

import { useState } from "react";
import { BASE_FEE, PER_MIN } from "@/lib/constants";

interface SessionFooterProps {
  countdown: string;
  remainingSeconds: number;
  totalSeconds: number;
  critical: boolean;
}

export function SessionFooter({
  countdown,
  remainingSeconds,
  totalSeconds,
  critical,
}: SessionFooterProps) {
  const [hovering, setHovering] = useState(false);

  const elapsed = totalSeconds - remainingSeconds;
  const elapsedMin = Math.floor(elapsed / 60);
  const elapsedSec = elapsed % 60;
  const totalMin = Math.floor(totalSeconds / 60);

  const progress = totalSeconds > 0 ? (remainingSeconds / totalSeconds) * 100 : 0;
  const costAccrued = BASE_FEE + elapsedMin * PER_MIN;
  const costTotal = BASE_FEE + totalMin * PER_MIN;

  return (
    <footer
      className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-200 ${
        hovering ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full"
      }`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{
        background: "rgba(10,10,10,0.92)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(0,255,65,0.09)",
      }}
    >
      {/* Progress bar */}
      <div className="h-px bg-white-dim/10 relative">
        <div
          className={`absolute top-0 left-0 h-full transition-all duration-1000 ${
            critical ? "bg-error" : "bg-green"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="h-[40px] flex items-center justify-between px-4 text-[10px]">
        {/* Left: Elapsed */}
        <div className="flex items-center gap-3">
          <span className="text-white-dim/40 tracking-wider uppercase">Elapsed</span>
          <span className="text-white-mid font-mono tabular-nums">
            {String(elapsedMin).padStart(2, "0")}:{String(elapsedSec).padStart(2, "0")}
          </span>
          <span className="text-white-dim/20">/</span>
          <span className="text-white-dim/40 font-mono tabular-nums">
            {String(totalMin).padStart(2, "0")}:00
          </span>
        </div>

        {/* Center: Timer (large) */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <span className={`text-[11px] font-mono font-bold tracking-wider tabular-nums ${
            critical
              ? "text-error [text-shadow:0_0_8px_rgba(255,59,59,0.3)]"
              : "text-green/60"
          }`}>
            {countdown}
          </span>
        </div>

        {/* Right: Cost */}
        <div className="flex items-center gap-3">
          <span className="text-white-dim/40 tracking-wider uppercase">Cost</span>
          <span className="text-white-mid font-mono">
            ${costAccrued.toFixed(2)}
          </span>
          <span className="text-white-dim/20">/</span>
          <span className="text-white-dim/40 font-mono">
            ${costTotal.toFixed(2)}
          </span>
        </div>
      </div>
    </footer>
  );
}
