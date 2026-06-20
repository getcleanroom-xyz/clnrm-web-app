"use client";

import { Clock, Stop, ArrowCircleLeft } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

interface SessionHeaderProps {
  connected: boolean;
  expiresAt: string | null;
  countdown: string;
  onDestroy: () => void;
  destroying: boolean;
}

export function SessionHeader({ connected, expiresAt, countdown, onDestroy, destroying }: SessionHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-green/12 bg-surface/80 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/")}
          className="text-white-dim hover:text-foreground transition-colors"
          title="Leave session"
        >
          <ArrowCircleLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? "bg-green animate-pulse" : "bg-error"}`} />
          <span className={`text-xs font-bold tracking-[0.1em] uppercase ${connected ? "text-green" : "text-error"}`}>
            {connected ? "Connected" : "Connecting..."}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {expiresAt && (
          <div className="flex items-center gap-1.5">
            <Clock size={14} className="text-white-dim" />
            <span className="text-xs text-white-mid font-mono">{countdown}</span>
          </div>
        )}
        <button
          onClick={onDestroy}
          disabled={destroying}
          className="clip-spell inline-flex items-center gap-1.5 border border-error/40 text-error text-[10px] font-bold tracking-[0.15em] uppercase px-3 py-1.5 transition-all hover:bg-error/10 disabled:opacity-40"
        >
          <Stop size={12} />
          {destroying ? "..." : "Destroy"}
        </button>
      </div>
    </div>
  );
}
