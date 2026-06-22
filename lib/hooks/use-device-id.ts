"use client";

import { useState } from "react";

const DEVICE_ID_KEY = "clnrm_device_id";

function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Returns a stable device ID, persisted in localStorage.
 * Same device = same ID across tabs and browser restarts.
 * Clearing localStorage resets the ID (and the mint cooldown).
 */
export function useDeviceId(): string {
  const [deviceId] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      let id = localStorage.getItem(DEVICE_ID_KEY);
      if (!id) {
        id = generateUUID();
        localStorage.setItem(DEVICE_ID_KEY, id);
      }
      return id;
    } catch {
      return generateUUID();
    }
  });
  return deviceId;
}
