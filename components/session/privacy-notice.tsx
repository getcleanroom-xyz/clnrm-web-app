"use client";

import { useState, useEffect } from "react";
import { Info } from "@phosphor-icons/react";

const DISMISS_KEY = "clnrm_privacy_notice_dismissed";

export function PrivacyNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const dismissed = localStorage.getItem(DISMISS_KEY);
        if (!dismissed) setVisible(true);
      } catch {
        setVisible(true);
      }
    }, 3000);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, "true"); } catch {}
    setVisible(false);
  };

  return (
    <div
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 max-w-md w-[calc(100%-32px)]"
      style={{
        background: "rgba(10,10,10,0.95)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(0,255,65,0.09)",
        clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
      }}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Info size={16} weight="bold" className="text-green shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-green mb-1">
              Connection visible
            </div>
            <div className="text-[11px] text-white-mid leading-[1.7]">
              Your connection to this session is visible to your ISP or network.
              Browsing inside the session routes through Tor, but the VNC stream
              to CleanRoom does not. For maximum privacy, connect via{" "}
              <span className="text-foreground font-bold">VPN</span> or{" "}
              <span className="text-foreground font-bold">Tor Browser</span>.
            </div>
          </div>
          <button
            onClick={dismiss}
            className="shrink-0 text-white-dim/40 hover:text-foreground transition-colors text-xs"
            aria-label="Dismiss"
          >
            &times;
          </button>
        </div>
      </div>
    </div>
  );
}
