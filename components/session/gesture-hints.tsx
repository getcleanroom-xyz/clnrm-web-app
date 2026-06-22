"use client";

import { useState, useEffect } from "react";

const GESTURE_HINT_KEY = "clnrm_gesture_hints_dismissed";

export function GestureHints() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(GESTURE_HINT_KEY);
      if (!dismissed) {
        // Small delay so it doesn't flash on fast connections
        const t = setTimeout(() => setVisible(true), 2000);
        return () => clearTimeout(t);
      }
    } catch {}
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(GESTURE_HINT_KEY, Date.now().toString());
    } catch {}
    setVisible(false);
  };

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={dismiss}
    >
      <div className="bg-surface border border-green/12 p-6 max-w-xs text-center mx-4">
        <div className="text-green text-xs font-bold tracking-[0.15em] uppercase mb-4">
          Touch Controls
        </div>
        <div className="space-y-2 text-[11px] text-white-mid leading-relaxed">
          <div><span className="text-foreground font-bold">Tap</span> = Left click</div>
          <div><span className="text-foreground font-bold">Two-finger tap</span> = Right click</div>
          <div><span className="text-foreground font-bold">Drag</span> = Scroll / move cursor</div>
          <div><span className="text-foreground font-bold">Pinch</span> = Zoom in/out</div>
        </div>
        <button
          onClick={dismiss}
          className="mt-4 px-4 py-2 text-[10px] font-bold tracking-[0.15em] uppercase border border-green/40 text-green hover:bg-green-dim/30 transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
