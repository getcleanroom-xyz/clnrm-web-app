"use client";

import { useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from "react";
import type RFB from "@novnc/novnc";

/**
 * Hidden textarea that captures mobile soft keyboard input
 * and forwards it to the VNC session via RFB sendKey.
 */
export interface MobileKeyboardHandle {
  open: () => void;
  close: () => void;
  isOpen: () => boolean;
}

interface MobileKeyboardProps {
  rfbRef: React.RefObject<RFB | null>;
}

// Keysyms for special keys
const KEYSYM = {
  backspace: 0xff08,
  tab: 0xff09,
  enter: 0xff0d,
  escape: 0xff1b,
  arrowLeft: 0xff51,
  arrowUp: 0xff52,
  arrowRight: 0xff53,
  arrowDown: 0xff54,
  delete: 0xffff,
} as const;

function charToKeysym(ch: string): number {
  const code = ch.codePointAt(0);
  if (code === undefined) return 0;
  // ASCII range maps directly to keysym
  if (code >= 0x20 && code <= 0x7e) return code;
  // Unicode keysym = 0x01000000 + codepoint
  return 0x01000000 + code;
}

export const MobileKeyboard = forwardRef<MobileKeyboardHandle, MobileKeyboardProps>(
  function MobileKeyboard({ rfbRef }, ref) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const prevValueRef = useRef("");
    const isOpenRef = useRef(false);

    const open = useCallback(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      ta.value = "";
      prevValueRef.current = "";
      ta.focus();
      isOpenRef.current = true;
    }, []);

    const close = useCallback(() => {
      textareaRef.current?.blur();
      isOpenRef.current = false;
    }, []);

    const isOpen = useCallback(() => isOpenRef.current, []);

    useImperativeHandle(ref, () => ({ open, close, isOpen }), [open, close, isOpen]);

    const handleInput = useCallback(() => {
      const ta = textareaRef.current;
      const rfb = rfbRef.current;
      if (!ta || !rfb) return;

      const current = ta.value;
      const prev = prevValueRef.current;
      prevValueRef.current = current;

      if (current.length > prev.length) {
        // Characters added — send each new character
        const added = current.slice(prev.length);
        for (const ch of added) {
          const keysym = charToKeysym(ch);
          if (keysym) {
            rfb.sendKey(keysym, "", true);
            rfb.sendKey(keysym, "", false);
          }
        }
      } else if (current.length < prev.length) {
        // Characters deleted — send backspace
        const deleted = prev.length - current.length;
        for (let i = 0; i < deleted; i++) {
          rfb.sendKey(KEYSYM.backspace, "Backspace", true);
          rfb.sendKey(KEYSYM.backspace, "Backspace", false);
        }
      }

      // Keep textarea from growing too long
      if (current.length > 500) {
        ta.value = current.slice(-200);
        prevValueRef.current = ta.value;
      }
    }, [rfbRef]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        const rfb = rfbRef.current;
        if (!rfb) return;

        if (e.key === "Enter") {
          e.preventDefault();
          rfb.sendKey(KEYSYM.enter, "Enter", true);
          rfb.sendKey(KEYSYM.enter, "Enter", false);
        } else if (e.key === "Tab") {
          e.preventDefault();
          rfb.sendKey(KEYSYM.tab, "Tab", true);
          rfb.sendKey(KEYSYM.tab, "Tab", false);
        }
      },
      [rfbRef],
    );

    // Prevent the textarea from interfering with the VNC canvas gestures
    useEffect(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      const prevent = (e: Event) => e.stopPropagation();
      ta.addEventListener("touchstart", prevent, { passive: true });
      ta.addEventListener("touchmove", prevent, { passive: true });
      return () => {
        ta.removeEventListener("touchstart", prevent);
        ta.removeEventListener("touchmove", prevent);
      };
    }, []);

    return (
      <textarea
        ref={textareaRef}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        style={{
          position: "absolute",
          left: "-9999px",
          top: "0",
          width: "1px",
          height: "1px",
          opacity: 0,
          fontSize: "16px", // prevents iOS zoom on focus
        }}
      />
    );
  },
);
