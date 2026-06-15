"use client";

import { useState } from "react";
import { Copy, Terminal, CaretDown, CaretRight } from "@phosphor-icons/react";

interface AdbPanelProps {
  adbPort: number | null;
  host?: string;
}

export function AdbPanel({ adbPort, host }: AdbPanelProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!adbPort) return null;

  const connectHost = host || "api.getcleanroom.xyz";
  const connectCommand = `adb connect ${connectHost}:${adbPort}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(connectCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="border-t border-[rgba(0,255,65,0.08)] bg-void/80">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-[11px] tracking-[0.1em] uppercase text-white-dim hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-2">
          <Terminal size={14} className="text-green" />
          ADB Access
        </span>
        {open ? <CaretDown size={12} /> : <CaretRight size={12} />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          <p className="text-[11px] text-white-dim leading-relaxed">
            Connect to the Android container via Android Debug Bridge. Your
            ADB client must authorize with the device — accept the RSA
            fingerprint prompt on first connection.
          </p>

          <div className="bg-[rgba(0,0,0,0.4)] border border-[rgba(0,255,65,0.1)] p-3">
            <div className="text-[9px] tracking-[0.2em] uppercase text-white-dim/40 mb-1.5">
              Connect command
            </div>
            <code className="text-sm text-green break-all">{connectCommand}</code>
          </div>

          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold tracking-[0.1em] uppercase border border-[rgba(0,255,65,0.2)] text-green hover:bg-green-dim/20 transition-colors"
          >
            <Copy size={11} />
            {copied ? "Copied" : "Copy command"}
          </button>

          <div className="flex items-start gap-2 p-2 border-l-2 border-white-dim/20">
            <span className="text-[10px] text-white-dim leading-relaxed">
              The ADB port is bound to the server&apos;s loopback. Remote
              connections need an SSH tunnel:
              <br />
              <code className="text-green text-[10px] block mt-1">
                ssh -L {adbPort}:127.0.0.1:{adbPort} root@api.getcleanroom.xyz
              </code>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
