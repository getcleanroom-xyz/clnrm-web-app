"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import {
  Clock,
  Stop,
  ArrowCircleLeft,
  ArrowClockwise,
  Keyboard,
  DotsThree,
  X,
  Clipboard as ClipboardIcon,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
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
import { SpecialKeys } from "./special-keys";
import { ClipboardSync } from "./clipboard-sync";
import type { MobileKeyboardHandle } from "./mobile-keyboard";
import type RFB from "@novnc/novnc";

interface SessionHeaderProps {
  connected: boolean;
  reconnectFailed?: boolean;
  expiresAt: string | null;
  countdown: string;
  countdownWarning?: boolean;
  countdownCritical?: boolean;
  onDestroy: () => void;
  destroying: boolean;
  rfbRef?: React.RefObject<RFB | null>;
  keyboardRef?: React.RefObject<MobileKeyboardHandle | null>;
}

export function SessionHeader({
  connected,
  reconnectFailed,
  expiresAt,
  countdown,
  countdownWarning,
  countdownCritical,
  onDestroy,
  destroying,
  rfbRef,
  keyboardRef,
}: SessionHeaderProps) {
  const router = useRouter();
  const device = useDevice();
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDestroyDialog, setShowDestroyDialog] = useState(false);
  const [showSpecialKeys, setShowSpecialKeys] = useState(false);
  const [showOverflow, setShowOverflow] = useState(false);

  const statusColor = connected
    ? "text-green"
    : reconnectFailed
      ? "text-error"
      : "text-white-mid";

  const dotColor = connected
    ? "bg-green animate-pulse"
    : reconnectFailed
      ? "bg-error"
      : "bg-white-mid animate-pulse";

  const statusText = connected
    ? "Connected"
    : reconnectFailed
      ? "Disconnected"
      : "Connecting...";

  const isMobile = device.isMobile || device.isTablet;

  return (
    <>
      <div
        className={`relative z-50 flex items-center justify-between border-b border-green/12 bg-surface/80 backdrop-blur-sm ${
          isMobile ? "px-3 py-3" : "px-4 py-2"
        }`}
      >
        {/* Left: Back + Status */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLeaveDialog(true)}
            className="flex items-center justify-center min-w-[44px] min-h-[44px] text-white-dim hover:text-foreground transition-colors"
            title="Leave session"
          >
            <ArrowCircleLeft size={isMobile ? 22 : 18} />
          </button>

          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${dotColor}`} />
            <span
              className={`text-[10px] sm:text-xs font-bold tracking-[0.1em] uppercase ${statusColor}`}
            >
              {isMobile && !reconnectFailed ? "" : statusText}
            </span>
            {reconnectFailed && (
              <button
                onClick={() => window.location.reload()}
                className="flex items-center justify-center min-w-[44px] min-h-[44px] text-white-dim hover:text-foreground transition-colors"
                title="Reconnect"
              >
                <ArrowClockwise size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Center: Countdown */}
        {expiresAt && (
          <div className="flex items-center gap-1.5">
            <Clock
              size={isMobile ? 16 : 14}
              className={countdownCritical ? "text-error" : "text-white-dim"}
            />
            <span
              className={`text-xs font-mono ${
                countdownCritical
                  ? "text-error font-bold"
                  : countdownWarning
                    ? "text-white-mid"
                    : "text-white-mid"
              }`}
            >
              {countdown}
            </span>
          </div>
        )}

        {/* Right: Controls */}
        <div className="flex items-center gap-1">
          {isMobile ? (
            <>
              <button
                onClick={() => keyboardRef?.current?.open()}
                className="flex items-center justify-center min-w-[44px] min-h-[44px] text-white-dim hover:text-foreground transition-colors"
                title="Keyboard"
              >
                <Keyboard size={20} />
              </button>
              <button
                onClick={() => setShowOverflow(!showOverflow)}
                className="flex items-center justify-center min-w-[44px] min-h-[44px] text-white-dim hover:text-foreground transition-colors"
                title="More options"
              >
                <DotsThree size={20} />
              </button>
            </>
          ) : (
            <>
              {rfbRef && <SpecialKeys rfbRef={rfbRef} visible={showSpecialKeys} onToggle={() => setShowSpecialKeys(!showSpecialKeys)} />}
              {rfbRef && <ClipboardSync rfbRef={rfbRef} />}
              <button
                onClick={() => setShowDestroyDialog(true)}
                disabled={destroying}
                className="clip-spell inline-flex items-center gap-1.5 border border-error/40 text-error text-[10px] font-bold tracking-[0.15em] uppercase px-3 py-1.5 transition-all hover:bg-error/10 disabled:opacity-40"
              >
                <Stop size={12} />
                {destroying ? "..." : "Destroy"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile overflow bottom sheet */}
      {isMobile && showOverflow && createPortal(
        <div className="fixed inset-x-0 bottom-0 z-[99999]">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowOverflow(false)} />
          <div className="relative bg-surface border-t border-green/12 px-4 pb-6 pt-4">
            <button onClick={() => setShowOverflow(false)} className="absolute top-3 right-4 text-white-dim hover:text-foreground transition-colors">
              <X size={16} />
            </button>
            <div className="text-[9px] text-white-dim uppercase tracking-wider mb-3">Session controls</div>
            <div className="flex flex-col gap-2">
              {rfbRef && (
                <>
                  <button
                    onClick={() => { setShowOverflow(false); setShowSpecialKeys(true); }}
                    className="flex items-center gap-3 min-h-[44px] px-4 border border-white-dim/20 text-white-mid text-xs font-bold tracking-wider uppercase hover:text-foreground hover:border-white-dim/40 transition-colors"
                  >
                    <Keyboard size={16} />
                    Special keys
                  </button>
                  <button
                    onClick={() => { setShowOverflow(false); /* clipboard opens inline */ }}
                    className="flex items-center gap-3 min-h-[44px] px-4 border border-white-dim/20 text-white-mid text-xs font-bold tracking-wider uppercase hover:text-foreground hover:border-white-dim/40 transition-colors"
                  >
                    <ClipboardIcon size={16} />
                    Clipboard
                  </button>
                </>
              )}
              <button
                onClick={() => { setShowOverflow(false); setShowDestroyDialog(true); }}
                disabled={destroying}
                className="flex items-center gap-3 min-h-[44px] px-4 border border-error/30 text-error text-xs font-bold tracking-wider uppercase hover:bg-error/10 transition-colors disabled:opacity-40"
              >
                <Stop size={16} />
                {destroying ? "Destroying..." : "Destroy session"}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* Mobile: Portal-based special keys and clipboard (accessible from overflow) */}
      {isMobile && showSpecialKeys && rfbRef && (
        <SpecialKeys rfbRef={rfbRef} visible={showSpecialKeys} onToggle={() => setShowSpecialKeys(false)} />
      )}
      {isMobile && rfbRef && <ClipboardSync rfbRef={rfbRef} />}

      {/* Leave dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave session?</AlertDialogTitle>
            <AlertDialogDescription>
              The session will keep running and use your paid time until it expires. Destroy
              it first if you want to stop the timer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push("/")}>Leave</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Destroy dialog */}
      <AlertDialog open={showDestroyDialog} onOpenChange={setShowDestroyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Destroy session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately wipe all data in the session — browser history, downloads,
              cookies, everything. This cannot be undone.
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
