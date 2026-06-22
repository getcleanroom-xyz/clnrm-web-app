"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type RFB from "@novnc/novnc";
import { Clipboard } from "@phosphor-icons/react";
import { toast } from "@/lib/toast";

interface ClipboardSyncProps {
  rfbRef: React.RefObject<RFB | null>;
}

export function ClipboardSync({ rfbRef }: ClipboardSyncProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [remoteText, setRemoteText] = useState("");
  const btnRef = useRef<HTMLButtonElement>(null);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setPanelStyle({
      position: "fixed",
      bottom: `${window.innerHeight - rect.top + 8}px`,
      left: `${rect.left}px`,
      zIndex: 99999,
    });
  }, [open]);

  // Listen for clipboard events from the remote desktop
  useEffect(() => {
    const rfb = rfbRef.current;
    if (!rfb) return;

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ text: string }>).detail;
      if (detail?.text) {
        setRemoteText(detail.text);
      }
    };

    rfb.addEventListener("clipboard", handler);
    return () => {
      rfb.removeEventListener("clipboard", handler);
    };
  }, [rfbRef]);

  const handleGetFromRemote = useCallback(() => {
    if (remoteText) {
      setText(remoteText);
      toast.success("Remote clipboard loaded — select and copy from the text box");
    } else {
      toast.info("No text copied on the remote desktop yet");
    }
  }, [remoteText]);

  const handlePasteToRemote = useCallback(() => {
    const rfb = rfbRef.current;
    if (!rfb || !text) return;
    rfb.clipboardPasteFrom(text);
    toast.success("Sent to remote clipboard — paste with Ctrl+V");
    setOpen(false);
  }, [rfbRef, text]);

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center min-w-[44px] min-h-[44px] text-white-dim hover:text-foreground transition-colors"
        title="Clipboard"
      >
        <Clipboard size={16} />
      </button>

      {open &&
        createPortal(
          <>
            <div
              className="fixed inset-0"
              style={{ zIndex: 99998 }}
              onClick={() => setOpen(false)}
            />
            <div
              style={panelStyle}
              className="p-4 bg-surface border border-green/12 rounded-sm shadow-lg w-72"
            >
              <div className="text-[9px] text-white-dim uppercase tracking-wider mb-2">Clipboard</div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type or paste text here to send to the remote desktop..."
                className="w-full h-24 p-2 bg-void border border-white-dim/10 text-foreground text-xs font-mono resize-none focus:outline-none focus:border-green/30"
                style={{ fontSize: "16px" }}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handlePasteToRemote}
                  disabled={!text}
                  className="flex-1 px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase border border-green/40 text-green hover:bg-green-dim/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Paste to remote
                </button>
                <button
                  onClick={handleGetFromRemote}
                  className="flex-1 px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase border border-white-dim/30 text-white-dim hover:text-foreground transition-colors"
                >
                  Get from remote
                </button>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="mt-2 w-full text-center text-[10px] text-white-dim/50 hover:text-white-dim transition-colors"
              >
                Close
              </button>
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
