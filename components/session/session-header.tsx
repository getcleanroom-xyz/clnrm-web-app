"use client";

import { useState } from "react";
import {
  ArrowsOutSimple,
  Sidebar,
  SidebarSimple,
} from "@phosphor-icons/react";

interface SessionHeaderProps {
  sessionId: string;
  connected: boolean;
  countdown: string;
  critical: boolean;
  onToggleSidebar: () => void;
  sidebarVisible: boolean;
  onToggleFullscreen: () => void;
}

export function SessionHeader({
  sessionId,
  connected,
  countdown,
  critical,
  onToggleSidebar,
  sidebarVisible,
  onToggleFullscreen,
}: SessionHeaderProps) {
  const [hovering, setHovering] = useState(false);

  const shortId = sessionId.slice(0, 8);

  return (
    <header
      className={`fixed top-[60px] left-0 right-0 z-50 h-[48px] transition-all duration-200 ${
        hovering ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full"
      }`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{
        background: "rgba(10,10,10,0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(0,255,65,0.09)",
      }}
    >
      <div className="h-full flex items-center justify-between px-4">
        {/* Left: Brand + Session ID */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green" style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }} />
            <span className="text-[10px] tracking-[0.2em] uppercase text-green font-bold">
              CleanRoom
            </span>
          </div>
          <div className="w-px h-4 bg-white-dim/10" />
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-white-dim/40 tracking-wider">Session</span>
            <span className="text-[11px] text-white-mid font-mono tracking-wider">
              {shortId}…
            </span>
          </div>
        </div>

        {/* Center: Timer */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-green animate-pulse" : "bg-error"}`} />
          <span className={`text-[13px] font-mono font-bold tracking-wider tabular-nums ${
            critical ? "text-error [text-shadow:0_0_12px_rgba(255,59,59,0.4)]" : "text-green [text-shadow:0_0_12px_rgba(0,255,65,0.3)]"
          }`}>
            {countdown}
          </span>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-1">
          <HeaderBtn
            icon={sidebarVisible ? SidebarSimple : Sidebar}
            label="Toggle sidebar"
            onClick={onToggleSidebar}
          />
          <HeaderBtn
            icon={ArrowsOutSimple}
            label="Fullscreen"
            onClick={onToggleFullscreen}
          />
        </div>
      </div>
    </header>
  );
}

function HeaderBtn({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Sidebar;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="w-8 h-8 flex items-center justify-center text-white-dim hover:text-green transition-colors"
    >
      <Icon size={16} weight="bold" />
    </button>
  );
}
