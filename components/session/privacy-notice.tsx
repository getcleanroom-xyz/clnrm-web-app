"use client";

import { useState, useEffect } from "react";
import { Info, Copy } from "@phosphor-icons/react";
import { API_BASE } from "@/lib/api/client";

const DISMISS_KEY = "clnrm_privacy_notice_dismissed";
const ONION_CACHE_KEY = "clnrm_onion_address";

function getCachedOnion(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(ONION_CACHE_KEY);
  } catch {
    return null;
  }
}

export function PrivacyNotice() {
  const [visible, setVisible] = useState(false);
  const [onion, setOnion] = useState<string | null>(getCachedOnion);
  const [copied, setCopied] = useState(false);

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

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then((r) => r.json())
      .then((d) => {
        if (d.onion_address) {
          setOnion(d.onion_address);
          try { localStorage.setItem(ONION_CACHE_KEY, d.onion_address); } catch {}
        }
      })
      .catch(() => {});
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, "true"); } catch {}
    setVisible(false);
  };

  const copyOnion = () => {
    if (!onion) return;
    navigator.clipboard.writeText(`http://${onion}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
              Your connection to this session is visible to your ISP.
              Browsing inside the session routes through Tor, but the VNC stream
              does not.
            </div>

            {onion && (
              <div className="mt-3 p-2 border border-green/10"
                style={{ clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))" }}>
                <div className="text-[9px] text-green/60 tracking-[0.15em] uppercase mb-1">Connect via Tor</div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-green font-mono truncate flex-1">{onion}.onion</span>
                  <button
                    onClick={copyOnion}
                    className="shrink-0 text-white-dim/40 hover:text-green transition-colors"
                    aria-label="Copy onion address"
                  >
                    <Copy size={12} weight={copied ? "fill" : "bold"} />
                  </button>
                </div>
              </div>
            )}

            <p className="text-[10px] text-white-dim/40 mt-2">
              Open the .onion address in Tor Browser for end-to-end Tor routing.
            </p>
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
