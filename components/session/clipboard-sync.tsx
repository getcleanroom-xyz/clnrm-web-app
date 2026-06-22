"use client";

import { useState, useCallback } from "react";
import type RFB from "@novnc/novnc";
import { Clipboard } from "@phosphor-icons/react";
import { toast } from "@/lib/toast";

interface ClipboardSyncProps {
  rfbRef: React.RefObject<RFB | null>;
}

export function ClipboardSync({ rfbRef }: ClipboardSyncProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  const handlePaste = useCallback(() => {
    const rfb = rfbRef.current;
    if (!rfb || !text) return;
    rfb.clipboardPasteFrom(text);
    toast.success("Pasted to remote clipboard");
    setOpen(false);
  }, [rfbRef, text]);

  const handleCopyFromRemote = useCallback(async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      setText(clipText);
      toast.success("Copied from remote");
    } catch {
      toast.error("Could not read clipboard — browser permission denied");
    }
  }, []);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center w-9 h-9 rounded-none border border-white-dim/20 text-white-dim hover:text-foreground hover:border-white-dim/40 transition-colors"
        title="Clipboard sync"
      >
        <Clipboard size={16} />
      </button>
    );
  }

  return (
    <div className="absolute bottom-full left-0 mb-2 p-4 bg-surface border border-green/12 rounded-sm shadow-lg z-50 w-72">
      <div className="text-[9px] text-white-dim uppercase tracking-wider mb-2">Clipboard Sync</div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste text here to send to remote..."
        className="w-full h-24 p-2 bg-void border border-white-dim/10 text-foreground text-xs font-mono resize-none focus:outline-none focus:border-green/30"
        style={{ fontSize: "16px" }} // prevents iOS zoom
      />
      <div className="flex gap-2 mt-2">
        <button
          onClick={handlePaste}
          disabled={!text}
          className="flex-1 px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase border border-green/40 text-green hover:bg-green-dim/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Paste to remote
        </button>
        <button
          onClick={handleCopyFromRemote}
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
