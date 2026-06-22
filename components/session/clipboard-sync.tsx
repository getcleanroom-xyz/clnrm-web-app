"use client";

import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import type RFB from "@novnc/novnc";
import { Clipboard, X } from "@phosphor-icons/react";
import { toast } from "@/lib/toast";
import { useDevice } from "@/lib/hooks/use-device";

interface ClipboardSyncProps {
  rfbRef: React.RefObject<RFB | null>;
}

export function ClipboardSync({ rfbRef }: ClipboardSyncProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [remoteText, setRemoteText] = useState("");
  const device = useDevice();

  // Listen for clipboard events from the remote desktop
  useEffect(() => {
    const rfb = rfbRef.current;
    if (!rfb) return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ text: string }>).detail;
      if (detail?.text) setRemoteText(detail.text);
    };
    rfb.addEventListener("clipboard", handler);
    return () => rfb.removeEventListener("clipboard", handler);
  }, [rfbRef]);

  const handleGetFromRemote = useCallback(() => {
    if (remoteText) {
      setText(remoteText);
      toast.success("Remote clipboard loaded — copy from the text box");
    } else {
      toast.info("No text copied on the remote desktop yet");
    }
  }, [remoteText]);

  const handlePasteToRemote = useCallback(() => {
    const rfb = rfbRef.current;
    if (!rfb || !text) return;
    rfb.clipboardPasteFrom(text);
    toast.success("Sent to remote — paste with Ctrl+V");
    setOpen(false);
  }, [rfbRef, text]);

  const isMobile = device.isMobile || device.isTablet;

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center min-w-[44px] min-h-[44px] text-white-dim hover:text-foreground transition-colors"
        title="Clipboard"
      >
        <Clipboard size={16} />
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-x-0 bottom-0 z-[99999]">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/40" onClick={() => setOpen(false)} />

            {/* Panel */}
            <div
              className={`relative bg-surface border-t border-green/12 ${
                isMobile ? "px-4 pb-6 pt-4" : "px-6 pb-4 pt-4"
              }`}
            >
              {/* Close button */}
              <button
                onClick={() => setOpen(false)}
                className="absolute top-3 right-4 text-white-dim hover:text-foreground transition-colors"
              >
                <X size={16} />
              </button>

              <div className="text-[9px] text-white-dim uppercase tracking-wider mb-3">Clipboard</div>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type or paste text here to send to the remote desktop..."
                className="w-full h-24 p-3 bg-void border border-white-dim/10 text-foreground text-xs font-mono resize-none focus:outline-none focus:border-green/30"
                style={{ fontSize: "16px" }}
              />

              <div className="flex gap-2 mt-3">
                <button
                  onClick={handlePasteToRemote}
                  disabled={!text}
                  className="flex-1 min-h-[40px] text-[11px] font-bold tracking-wider uppercase border border-green/40 text-green hover:bg-green-dim/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Paste to remote
                </button>
                <button
                  onClick={handleGetFromRemote}
                  className="flex-1 min-h-[40px] text-[11px] font-bold tracking-wider uppercase border border-white-dim/30 text-white-dim hover:text-foreground transition-colors"
                >
                  Get from remote
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
