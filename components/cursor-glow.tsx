"use client";

import { useEffect } from "react";

export function CursorGlow() {
  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      document.body.style.setProperty("--cx", `${e.clientX}px`);
      document.body.style.setProperty("--cy", `${e.clientY}px`);
    }
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return null;
}
