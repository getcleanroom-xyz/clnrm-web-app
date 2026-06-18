"use client";

import { useEffect } from "react";

export function CursorGlow() {
  useEffect(() => {
    let ticking = false;
    function handleMouseMove(e: MouseEvent) {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        document.body.style.setProperty("--cx", `${e.clientX}px`);
        document.body.style.setProperty("--cy", `${e.clientY}px`);
        ticking = false;
      });
    }
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return null;
}
