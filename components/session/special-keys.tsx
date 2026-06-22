"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import type RFB from "@novnc/novnc";
import {
  Command,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from "@phosphor-icons/react";

interface SpecialKeysProps {
  rfbRef: React.RefObject<RFB | null>;
  visible: boolean;
  onToggle: () => void;
}

// X11 keysyms
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

const QUICK_KEYS: KeyDef[] = [
  { label: "Ctrl", keysym: KS.control, code: "ControlLeft" },
  { label: "Alt", keysym: KS.alt, code: "AltLeft" },
  { label: "Tab", keysym: KS.tab, code: "Tab" },
  { label: "Esc", keysym: KS.escape, code: "Escape" },
  { label: "Enter", keysym: KS.enter, code: "Enter" },
  { label: "Del", keysym: KS.delete, code: "Delete" },
];

const ARROW_KEYS: KeyDef[] = [
  { label: "←", keysym: KS.arrowLeft, code: "ArrowLeft", icon: <ArrowLeft size={14} /> },
  { label: "↑", keysym: KS.arrowUp, code: "ArrowUp", icon: <ArrowUp size={14} /> },
  { label: "↓", keysym: KS.arrowDown, code: "ArrowDown", icon: <ArrowDown size={14} /> },
  { label: "→", keysym: KS.arrowRight, code: "ArrowRight", icon: <ArrowRight size={14} /> },
];

const MODIFIER_KEYS: KeyDef[] = [
  { label: "Ctrl", keysym: KS.control, code: "ControlLeft" },
  { label: "Alt", keysym: KS.alt, code: "AltLeft" },
  { label: "Shift", keysym: KS.shift, code: "ShiftLeft" },
];

function sendKey(rfb: RFB, keysym: number, code: string) {
  rfb.sendKey(keysym, code, true);
  rfb.sendKey(keysym, code, false);
}

export function SpecialKeys({ rfbRef, visible, onToggle }: SpecialKeysProps) {
  const [stickyMods, setStickyMods] = useState<Set<string>>(new Set());
  const btnRef = useRef<HTMLButtonElement>(null);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});

  // Position the panel relative to the button using fixed positioning
  useEffect(() => {
    if (!visible || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setPanelStyle({
      position: "fixed",
      bottom: `${window.innerHeight - rect.top + 8}px`,
      left: `${rect.left}px`,
      zIndex: 99999,
    });
  }, [visible]);

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
        if (next.has(def.label)) {
          next.delete(def.label);
          const rfb = rfbRef.current;
          if (rfb) rfb.sendKey(def.keysym, def.code, false);
        } else {
          next.add(def.label);
          const rfb = rfbRef.current;
          if (rfb) rfb.sendKey(def.keysym, def.code, true);
        }
        return next;
      });
    },
    [rfbRef],
  );

  const sendCtrlAltDel = useCallback(() => {
    rfbRef.current?.sendCtrlAltDel();
  }, [rfbRef]);

  return (
    <>
      <button
        ref={btnRef}
        onClick={onToggle}
        className="flex items-center justify-center min-w-[44px] min-h-[44px] text-white-dim hover:text-foreground transition-colors"
        title="Special keys"
      >
        <Command size={16} />
      </button>

      {visible &&
        createPortal(
          <>
            {/* Click-away overlay */}
            <div
              className="fixed inset-0"
              style={{ zIndex: 99998 }}
              onClick={onToggle}
            />
            {/* Panel */}
            <div
              style={panelStyle}
              className="p-3 bg-surface border border-green/12 rounded-sm shadow-lg min-w-[280px]"
            >
              {/* Sticky modifiers */}
              <div className="flex items-center gap-1 mb-2">
                <span className="text-[9px] text-white-dim uppercase tracking-wider mr-1">Hold</span>
                {MODIFIER_KEYS.map((k) => (
                  <button
                    key={k.label}
                    onClick={() => toggleMod(k)}
                    className={`px-2.5 py-1.5 text-[10px] font-bold tracking-wider uppercase border transition-colors ${
                      stickyMods.has(k.label)
                        ? "bg-green/20 border-green text-green"
                        : "border-white-dim/20 text-white-dim hover:text-foreground hover:border-white-dim/40"
                    }`}
                  >
                    {k.label}
                  </button>
                ))}
              </div>

              {/* Action keys */}
              <div className="flex flex-wrap gap-1 mb-2">
                {QUICK_KEYS.map((k) => (
                  <button
                    key={k.label}
                    onClick={() => handleKey(k)}
                    className="px-2.5 py-1.5 text-[10px] font-bold tracking-wider uppercase border border-white-dim/20 text-white-dim hover:text-foreground hover:border-white-dim/40 transition-colors"
                  >
                    {k.label}
                  </button>
                ))}
              </div>

              {/* Arrow keys */}
              <div className="flex items-center gap-1 mb-2">
                <span className="text-[9px] text-white-dim uppercase tracking-wider mr-1">Nav</span>
                {ARROW_KEYS.map((k) => (
                  <button
                    key={k.label}
                    onClick={() => handleKey(k)}
                    className="w-8 h-8 flex items-center justify-center border border-white-dim/20 text-white-dim hover:text-foreground hover:border-white-dim/40 transition-colors"
                  >
                    {k.icon || k.label}
                  </button>
                ))}
              </div>

              {/* Ctrl+Alt+Del */}
              <button
                onClick={sendCtrlAltDel}
                className="w-full px-2.5 py-1.5 text-[10px] font-bold tracking-wider uppercase border border-error/30 text-error hover:bg-error/10 transition-colors"
              >
                Ctrl+Alt+Del
              </button>
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
