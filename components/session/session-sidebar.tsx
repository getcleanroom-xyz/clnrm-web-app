"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import type RFB from "@novnc/novnc";
import {
  Keyboard,
  Hand,
  Clipboard,
  ArrowsOutSimple,
  ArrowLeft,
  Trash,
  CaretUp,
  CaretDown,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDevice } from "@/lib/hooks/use-device";
import type { MobileKeyboardHandle } from "./mobile-keyboard";

const KS = {
  control: 0xffe3,
  alt: 0xffe9,
  shift: 0xffe1,
  tab: 0xff09,
  escape: 0xff1b,
  enter: 0xff0d,
  delete: 0xffff,
  arrowLeft: 0xff51,
  arrowUp: 0xff52,
  arrowRight: 0xff53,
  arrowDown: 0xff54,
} as const;

const MODIFIERS = [
  { label: "Ctrl", keysym: KS.control, code: "ControlLeft" },
  { label: "Alt", keysym: KS.alt, code: "AltLeft" },
  { label: "Shift", keysym: KS.shift, code: "ShiftLeft" },
] as const;

const ACTIONS = [
  { label: "Tab", keysym: KS.tab, code: "Tab" },
  { label: "Esc", keysym: KS.escape, code: "Escape" },
  { label: "Enter", keysym: KS.enter, code: "Enter" },
  { label: "Del", keysym: KS.delete, code: "Delete" },
] as const;

type Panel = null | "keys" | "clip";

interface SidebarProps {
  rfbRef: React.RefObject<RFB | null>;
  keyboardRef: React.RefObject<MobileKeyboardHandle | null>;
  onDestroy: () => void;
  destroying: boolean;
}

export function SessionSidebar({ rfbRef, keyboardRef, onDestroy, destroying }: SidebarProps) {
  const router = useRouter();
  const device = useDevice();
  const [panel, setPanel] = useState<Panel>(null);
  const [stickyMods, setStickyMods] = useState<Set<string>>(new Set());
  const [clipText, setClipText] = useState("");
  const [remoteClip, setRemoteClip] = useState("");
  const [showDestroy, setShowDestroy] = useState(false);
  const [autoHide, setAutoHide] = useState(false);

  const isMobile = device.isMobile || device.isTablet;

  useEffect(() => {
    const rfb = rfbRef.current;
    if (!rfb) return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ text: string }>).detail;
      if (detail?.text) setRemoteClip(detail.text);
    };
    rfb.addEventListener("clipboard", handler);
    return () => rfb.removeEventListener("clipboard", handler);
  }, [rfbRef]);

  useEffect(() => {
    if (!isMobile) return;
    const t = setTimeout(() => setAutoHide(true), 3000);
    return () => clearTimeout(t);
  }, [isMobile]);

  const sendKey = useCallback((keysym: number, code: string) => {
    const rfb = rfbRef.current;
    if (!rfb) return;
    rfb.sendKey(keysym, code, true);
    rfb.sendKey(keysym, code, false);
  }, [rfbRef]);

  const toggleMod = useCallback((label: string, keysym: number, code: string) => {
    setStickyMods((prev) => {
      const next = new Set(prev);
      const rfb = rfbRef.current;
      if (!rfb) return prev;
      if (next.has(label)) {
        next.delete(label);
        rfb.sendKey(keysym, code, false);
      } else {
        next.add(label);
        rfb.sendKey(keysym, code, true);
      }
      return next;
    });
  }, [rfbRef]);

  const handleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }, []);

  const handlePasteToRemote = useCallback(() => {
    const rfb = rfbRef.current;
    if (!rfb || !clipText) return;
    rfb.clipboardPasteFrom(clipText);
    setPanel(null);
  }, [rfbRef, clipText]);

  const handleGetFromRemote = useCallback(() => {
    setClipText(remoteClip);
  }, [remoteClip]);

  useEffect(() => {
    if (panel === "keys") return;
    const rfb = rfbRef.current;
    if (!rfb || stickyMods.size === 0) return;
    for (const label of stickyMods) {
      const mod = MODIFIERS.find((m) => m.label === label);
      if (mod) rfb.sendKey(mod.keysym, mod.code, false);
    }
    setStickyMods(new Set());
  }, [panel, rfbRef, stickyMods]);

  const sidebarVisible = !autoHide || panel !== null;

  return (
    <>
      <div
        className={`fixed left-0 top-[48px] bottom-0 z-40 flex transition-transform duration-200 ${
          sidebarVisible ? "translate-x-0" : "-translate-x-full"
        }`}
        onMouseEnter={() => setAutoHide(false)}
        onMouseLeave={() => { if (!panel && isMobile) setAutoHide(true); }}
      >
        <div
          className="flex flex-col gap-0 py-2 px-1"
          style={{
            background: "rgba(17,17,17,0.9)",
            backdropFilter: "blur(12px)",
            borderRight: "1px solid rgba(0,255,65,0.09)",
          }}
        >
          <SidebarBtn
            icon={Keyboard}
            label="Keyboard"
            onClick={() => keyboardRef?.current?.open()}
          />
          <SidebarBtn
            icon={Hand}
            label="Keys"
            active={panel === "keys"}
            onClick={() => setPanel(panel === "keys" ? null : "keys")}
          />
          <SidebarBtn
            icon={Clipboard}
            label="Clipboard"
            active={panel === "clip"}
            onClick={() => setPanel(panel === "clip" ? null : "clip")}
          />
          <SidebarBtn
            icon={ArrowsOutSimple}
            label="Fullscreen"
            onClick={handleFullscreen}
          />
          <div className="flex-1" />
          <SidebarBtn
            icon={ArrowLeft}
            label="Back"
            onClick={() => router.push("/")}
          />
          <SidebarBtn
            icon={Trash}
            label="Destroy"
            destructive
            onClick={() => setShowDestroy(true)}
            disabled={destroying}
          />
        </div>

        {panel === "keys" && (
          <div
            className="p-3 w-[220px] overflow-y-auto"
            style={{
              background: "rgba(17,17,17,0.95)",
              backdropFilter: "blur(12px)",
              borderRight: "1px solid rgba(0,255,65,0.09)",
              clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)",
            }}
          >
            <div className="text-[9px] text-white-dim uppercase tracking-[0.22em] mb-3">Modifiers</div>
            <div className="flex gap-1.5 mb-4">
              {MODIFIERS.map((m) => (
                <button
                  key={m.label}
                  onClick={() => toggleMod(m.label, m.keysym, m.code)}
                  className={`flex-1 py-2 text-[11px] font-bold tracking-[0.1em] uppercase border transition-colors ${
                    stickyMods.has(m.label)
                      ? "bg-green/20 border-green text-green"
                      : "border-white-dim/20 text-white-dim hover:text-foreground hover:border-white-dim/40"
                  }`}
                  style={{ clipPath: "polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)" }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="text-[9px] text-white-dim uppercase tracking-[0.22em] mb-3">Actions</div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {ACTIONS.map((a) => (
                <button
                  key={a.label}
                  onClick={() => sendKey(a.keysym, a.code)}
                  className="px-3 py-2 text-[11px] font-bold tracking-[0.1em] uppercase border border-white-dim/20 text-white-dim hover:text-foreground hover:border-white-dim/40 transition-colors"
                  style={{ clipPath: "polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)" }}
                >
                  {a.label}
                </button>
              ))}
            </div>

            <div className="text-[9px] text-white-dim uppercase tracking-[0.22em] mb-3">Navigation</div>
            <div className="grid grid-cols-3 gap-1.5 mb-4 w-fit">
              <div />
              <ArrowBtn label={<CaretUp size={14} weight="bold" />} onClick={() => sendKey(KS.arrowUp, "ArrowUp")} />
              <div />
              <ArrowBtn label={<CaretLeft size={14} weight="bold" />} onClick={() => sendKey(KS.arrowLeft, "ArrowLeft")} />
              <ArrowBtn label={<CaretDown size={14} weight="bold" />} onClick={() => sendKey(KS.arrowDown, "ArrowDown")} />
              <ArrowBtn label={<CaretRight size={14} weight="bold" />} onClick={() => sendKey(KS.arrowRight, "ArrowRight")} />
            </div>

            <button
              onClick={() => rfbRef.current?.sendCtrlAltDel()}
              className="w-full py-2 text-[11px] font-bold tracking-[0.1em] uppercase border border-error/30 text-error hover:bg-error/10 transition-colors"
              style={{ clipPath: "polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)" }}
            >
              Ctrl+Alt+Del
            </button>
          </div>
        )}

        {panel === "clip" && (
          <div
            className="p-3 w-[260px] overflow-y-auto"
            style={{
              background: "rgba(17,17,17,0.95)",
              backdropFilter: "blur(12px)",
              borderRight: "1px solid rgba(0,255,65,0.09)",
              clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)",
            }}
          >
            <div className="text-[9px] text-white-dim uppercase tracking-[0.22em] mb-3">Clipboard</div>
            <textarea
              value={clipText}
              onChange={(e) => setClipText(e.target.value)}
              placeholder="Type or paste text to send to the remote desktop..."
              className="w-full h-24 p-2 bg-void border border-white-dim/10 text-foreground text-xs font-mono resize-none focus:outline-none focus:border-green/30"
              style={{ fontSize: "16px", clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)" }}
            />
            <div className="flex gap-1.5 mt-2">
              <button
                onClick={handlePasteToRemote}
                disabled={!clipText}
                className="flex-1 py-2 text-[11px] font-bold tracking-[0.1em] uppercase border border-green/40 text-green hover:bg-green-dim/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                style={{ clipPath: "polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)" }}
              >
                Send
              </button>
              <button
                onClick={handleGetFromRemote}
                className="flex-1 py-2 text-[11px] font-bold tracking-[0.1em] uppercase border border-white-dim/30 text-white-dim hover:text-foreground transition-colors"
                style={{ clipPath: "polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)" }}
              >
                Get
              </button>
            </div>
          </div>
        )}
      </div>

      {autoHide && panel === null && (
        <button
          onClick={() => setAutoHide(false)}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-40 w-3 h-12 bg-surface/60 border border-l-0 border-green/12 hover:bg-surface/90 transition-colors"
          title="Open controls"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 calc(100% - 8px))" }}
        />
      )}

      <AlertDialog open={showDestroy} onOpenChange={setShowDestroy}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Destroy session?</AlertDialogTitle>
            <AlertDialogDescription>
              All data will be wiped immediately. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDestroy} variant="destructive">
              Destroy
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function SidebarBtn({
  icon: Icon,
  label,
  active,
  destructive,
  onClick,
  disabled,
}: {
  icon: typeof Keyboard;
  label: string;
  active?: boolean;
  destructive?: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`w-[40px] h-[40px] flex items-center justify-center transition-colors ${
        destructive
          ? "text-error hover:bg-error/10"
          : active
            ? "bg-green/10 text-green"
            : "text-white-dim hover:text-foreground"
      } disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      <Icon size={18} weight="bold" />
    </button>
  );
}

function ArrowBtn({ label, onClick }: { label: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-[44px] h-[36px] flex items-center justify-center text-white-dim hover:text-foreground transition-colors"
    >
      {label}
    </button>
  );
}
