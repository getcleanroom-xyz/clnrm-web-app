"use client";

import { useState, useCallback, useEffect } from "react";
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

  // Load remote text into textarea for easy local copying
  const handleGetFromRemote = useCallback(() => {
    if (remoteText) {
      setText(remoteText);
      toast.success("Remote clipboard loaded — select and copy from the text box");
    } else {
      toast.info("No text copied on the remote desktop yet");
    }
  }, [remoteText]);

  // Send textarea content to remote clipboard
  const handlePasteToRemote = useCallback(() => {
    const rfb = rfbRef.current;
    if (!rfb || !text) return;
    rfb.clipboardPasteFrom(text);
    toast.success("Sent to remote clipboard — paste with Ctrl+V");
    setOpen(false);
  }, [rfbRef, text]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center min-w-[44px] min-h-[44px] text-white-dim hover:text-foreground hover:border-white-dim/40 transition-colors"
        title="Clipboard"
      >
        <Clipboard size={16} />
      </button>
    );
  }

  return (
    <div className="absolute bottom-full left-0 mb-2 p-4 bg-surface border border-green/12 rounded-sm shadow-lg z-50 w-72">
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
  );
}
