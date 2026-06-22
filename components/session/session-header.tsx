"use client";

import { useState } from "react";
import { Clock, Stop, ArrowCircleLeft, ArrowClockwise } from "@phosphor-icons/react";
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

interface SessionHeaderProps {
  connected: boolean;
  reconnectFailed?: boolean;
  expiresAt: string | null;
  countdown: string;
  countdownWarning?: boolean;
  countdownCritical?: boolean;
  onDestroy: () => void;
  destroying: boolean;
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
}: SessionHeaderProps) {
  const router = useRouter();
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDestroyDialog, setShowDestroyDialog] = useState(false);

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

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-green/12 bg-surface/80 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowLeaveDialog(true)}
          className="text-white-dim hover:text-foreground transition-colors"
          title="Leave session"
        >
          <ArrowCircleLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${dotColor}`} />
          <span className={`text-xs font-bold tracking-[0.1em] uppercase ${statusColor}`}>
            {statusText}
          </span>
          {reconnectFailed && (
            <button
              onClick={() => window.location.reload()}
              className="ml-2 text-white-dim hover:text-foreground transition-colors"
              title="Reconnect"
            >
              <ArrowClockwise size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {expiresAt && (
          <div className="flex items-center gap-1.5">
            <Clock size={14} className={countdownCritical ? "text-error" : countdownWarning ? "text-white-mid" : "text-white-dim"} />
            <span className={`text-xs font-mono ${countdownCritical ? "text-error font-bold" : countdownWarning ? "text-white-mid" : "text-white-mid"}`}>
              {countdown}
            </span>
          </div>
        )}
        <button
          onClick={() => setShowDestroyDialog(true)}
          disabled={destroying}
          className="clip-spell inline-flex items-center gap-1.5 border border-error/40 text-error text-[10px] font-bold tracking-[0.15em] uppercase px-3 py-1.5 transition-all hover:bg-error/10 disabled:opacity-40"
        >
          <Stop size={12} />
          {destroying ? "..." : "Destroy"}
        </button>
      </div>

      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave session?</AlertDialogTitle>
            <AlertDialogDescription>
              The session will keep running and use your paid time until it expires. Destroy it first if you want to stop the timer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push("/")}>
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDestroyDialog} onOpenChange={setShowDestroyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Destroy session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately wipe all data in the session — browser history, downloads, cookies, everything. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDestroy}
              variant="destructive"
            >
              Destroy
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
