"use client";

import { useCallback, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import type RFB from "@novnc/novnc";
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  X,
} from "@phosphor-icons/react";
import { useDevice } from "@/lib/hooks/use-device";

interface SpecialKeysProps {
  rfbRef: React.RefObject<RFB | null>;
  visible: boolean;
  onToggle: () => void;
}

const KS = {
  control: 0xffe3,
  alt: 0xffe9,
  shift: 0xffe1,
  tab: 0xff09,
  escape: 0xff1b,
  enter: 0xff0d,
  backspace: 0xff08,
  delete: 0xffff,
  arrowLeft: 0xff51,
  arrowUp: 0xff52,
  arrowRight: 0xff53,
  arrowDown: 0xff54,
} as const;

interface KeyDef {
  label: string;
  keysym: number;
  code: string;
  icon?: React.ReactNode;
}

const MODIFIER_KEYS: KeyDef[] = [
  { label: "Ctrl", keysym: KS.control, code: "ControlLeft" },
  { label: "Alt", keysym: KS.alt, code: "AltLeft" },
  { label: "Shift", keysym: KS.shift, code: "ShiftLeft" },
];

const ACTION_KEYS: KeyDef[] = [
  { label: "Tab", keysym: KS.tab, code: "Tab" },
  { label: "Esc", keysym: KS.escape, code: "Escape" },
  { label: "Enter", keysym: KS.enter, code: "Enter" },
  { label: "Del", keysym: KS.delete, code: "Delete" },
  { label: "←", keysym: KS.arrowLeft, code: "ArrowLeft", icon: <ArrowLeft size={14} /> },
  { label: "↑", keysym: KS.arrowUp, code: "ArrowUp", icon: <ArrowUp size={14} /> },
  { label: "↓", keysym: KS.arrowDown, code: "ArrowDown", icon: <ArrowDown size={14} /> },
  { label: "→", keysym: KS.arrowRight, code: "ArrowRight", icon: <ArrowRight size={14} /> },
];

function sendKey(rfb: RFB, keysym: number, code: string) {
  rfb.sendKey(keysym, code, true);
  rfb.sendKey(keysym, code, false);
}

export function SpecialKeys({ rfbRef, visible, onToggle }: SpecialKeysProps) {
  const device = useDevice();
  const [stickyMods, setStickyMods] = useState<Set<string>>(new Set());

  // Release all sticky modifiers on close
  useEffect(() => {
    if (visible) return;
    const rfb = rfbRef.current;
    if (!rfb || stickyMods.size === 0) return;
    for (const label of stickyMods) {
      const mod = MODIFIER_KEYS.find((k) => k.label === label);
      if (mod) rfb.sendKey(mod.keysym, mod.code, false);
    }
    setStickyMods(new Set());
  }, [visible, rfbRef, stickyMods]);

  const handleKey = useCallback(
    (def: KeyDef) => {
      const rfb = rfbRef.current;
      if (!rfb) return;
      sendKey(rfb, def.keysym, def.code);
    },
    [rfbRef],
  );

  const toggleMod = useCallback(
    (def: KeyDef) => {
      setStickyMods((prev) => {
        const next = new Set(prev);
        const rfb = rfbRef.current;
        if (!rfb) return prev;
        if (next.has(def.label)) {
          next.delete(def.label);
          rfb.sendKey(def.keysym, def.code, false);
        } else {
          next.add(def.label);
          rfb.sendKey(def.keysym, def.code, true);
        }
        return next;
      });
    },
    [rfbRef],
  );

  const sendCtrlAltDel = useCallback(() => {
    rfbRef.current?.sendCtrlAltDel();
  }, [rfbRef]);

  const isMobile = device.isMobile || device.isTablet;

  if (!visible) return null;

  return createPortal(
    <div className="fixed inset-x-0 bottom-0 z-[99999]">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40" onClick={onToggle} />

      {/* Panel */}
      <div
        className={`relative bg-surface border-t border-green/12 ${
          isMobile ? "px-4 pb-6 pt-4" : "px-6 pb-4 pt-4"
        }`}
      >
        {/* Close button */}
        <button
          onClick={onToggle}
          className="absolute top-3 right-4 text-white-dim hover:text-foreground transition-colors"
        >
          <X size={16} />
        </button>

        {/* Sticky modifiers */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[9px] text-white-dim uppercase tracking-wider shrink-0">Hold</span>
          <div className="flex gap-1.5">
            {MODIFIER_KEYS.map((k) => (
              <button
                key={k.label}
                onClick={() => toggleMod(k)}
                className={`min-w-[44px] min-h-[36px] px-3 text-[11px] font-bold tracking-wider uppercase border transition-colors ${
                  stickyMods.has(k.label)
                    ? "bg-green/20 border-green text-green"
                    : "border-white-dim/20 text-white-dim hover:text-foreground hover:border-white-dim/40"
                }`}
              >
                {k.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action + arrow keys */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[9px] text-white-dim uppercase tracking-wider shrink-0">Keys</span>
          <div className="flex flex-wrap gap-1.5">
            {ACTION_KEYS.map((k) => (
              <button
                key={k.label}
                onClick={() => handleKey(k)}
                className="min-w-[44px] min-h-[36px] px-2.5 flex items-center justify-center text-[11px] font-bold tracking-wider uppercase border border-white-dim/20 text-white-dim hover:text-foreground hover:border-white-dim/40 transition-colors"
              >
                {k.icon || k.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ctrl+Alt+Del */}
        <button
          onClick={sendCtrlAltDel}
          className="w-full min-h-[40px] text-[11px] font-bold tracking-wider uppercase border border-error/30 text-error hover:bg-error/10 transition-colors"
        >
          Ctrl+Alt+Del
        </button>
      </div>
    </div>,
    document.body,
  );
}
