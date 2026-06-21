import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { CursorGlow } from "@/components/cursor-glow";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { EnvBanner } from "@/components/env-banner";
import { SurveyBanner } from "@/components/survey-banner";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#00FF41",
};

export const metadata: Metadata = {
  title: {
    default: "CleanRoom — Virtual Disposable Browsers",
    template: "%s — CleanRoom",
  },
  description:
    "On-demand, privacy-first virtual browsers. Pay with Monero. Auto-destructs when you're done. No data retained.",
  icons: { icon: "/icon.svg", apple: "/apple-icon.svg" },
  openGraph: {
    title: "CleanRoom — Virtual Disposable Browsers",
    description:
      "On-demand, privacy-first virtual browsers. Pay with Monero. Auto-destructs when you're done. No data retained.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("dark", "h-full", "antialiased", geistSans.variable, jetbrainsMono.variable, "font-mono")}
    >
      <body className="min-h-full flex flex-col">
        <CursorGlow />
        <EnvBanner />
        <Nav />
        <main className="flex-1 pt-[60px]">
          <SurveyBanner />
          {children}
        </main>
        <Footer />
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
