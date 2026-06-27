"use client";

import { useState, useEffect } from "react";

export type DeviceType = "mobile" | "tablet" | "desktop";
export type Orientation = "portrait" | "landscape";

export interface DeviceInfo {
  deviceType: DeviceType;
  isTouch: boolean;
  orientation: Orientation;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
}

function detectDevice(): DeviceInfo {
  if (typeof window === "undefined") {
    return {
      deviceType: "desktop",
      isTouch: false,
      orientation: "landscape",
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      width: 1920,
      height: 1080,
    };
  }

  const w = window.innerWidth;
  const h = window.innerHeight;
  const isTouch =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0;
  const orientation: Orientation = h > w ? "portrait" : "landscape";

  let deviceType: DeviceType;
  if (w < 768) {
    deviceType = "mobile";
  } else if (w < 1024 && isTouch) {
    deviceType = "tablet";
  } else {
    deviceType = "desktop";
  }

  return {
    deviceType,
    isTouch,
    orientation,
    isMobile: deviceType === "mobile",
    isTablet: deviceType === "tablet",
    isDesktop: deviceType === "desktop",
    width: w,
    height: h,
  };
}

/**
 * Reactive device detection hook.
 * Updates on resize and orientation change.
 */
export function useDevice(): DeviceInfo {
  const [info, setInfo] = useState<DeviceInfo>(detectDevice);

  useEffect(() => {
    const update = () => setInfo(detectDevice());
    const onOrientationChange = () => {
      // orientationchange fires before resize settles
      setTimeout(update, 100);
    };

    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", onOrientationChange);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", onOrientationChange);
    };
  }, []);

  return info;
}

/**
 * Returns effective network type if available.
 * Useful for adaptive quality settings.
 */
export function useNetworkType(): "slow" | "fast" | "unknown" {
  const [type, setType] = useState<"slow" | "fast" | "unknown">("unknown");

  useEffect(() => {
    const conn = (navigator as unknown as Record<string, unknown>).connection as
      | { effectiveType?: string; addEventListener?: (e: string, cb: () => void) => void; removeEventListener?: (e: string, cb: () => void) => void }
      | undefined;

    if (!conn?.effectiveType) return;

    const update = () => {
      const t = conn.effectiveType;
      setType(t === "slow-2g" || t === "2g" || t === "3g" ? "slow" : "fast");
    };

    update();
    conn.addEventListener?.("change", update);
    return () => {
      conn.removeEventListener?.("change", update);
    };
  }, []);

  return type;
}
