"use client";

interface StatusPillProps {
  connected: boolean;
  countdown: string;
  critical?: boolean;
}

export function StatusPill({ connected, countdown, critical }: StatusPillProps) {
  return (
    <div className="absolute top-3 right-3 z-30 flex items-center gap-2 px-3 py-1.5 bg-surface/80 border border-green/12 backdrop-blur-sm transition-opacity duration-300">
      <div
        className={`w-1.5 h-1.5 rounded-full ${
          connected ? "bg-green animate-pulse" : "bg-error"
        }`}
      />
      <span
        className={`text-[10px] font-mono tracking-wider ${
          critical ? "text-error font-bold" : "text-white-dim"
        }`}
      >
        {countdown}
      </span>
    </div>
  );
}
