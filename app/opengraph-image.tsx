import { ImageResponse } from "next/og";
import { OgImageContent } from "@/components/seo/og-image";

export const alt = "CleanRoom — Virtual Disposable Browsers";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(<OgImageContent />, { ...size });
}