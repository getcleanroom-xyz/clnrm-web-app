"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, useCallback } from "react";

const footerLinks = [
  { href: "https://api.getcleanroom.xyz/docs", label: "API Docs" },
  { href: "https://github.com/getcleanroom-xyz/clnrm-web-app", label: "GitHub" },
  { href: "mailto:admin@getcleanroom.xyz", label: "Contact" },
];

const TEXT = "your privacy counts.";

export function Footer() {
  const [typed, setTyped] = useState("");
  const [started, setStarted] = useState(false);
  const [showExpanded, setShowExpanded] = useState(false);
  const promptRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = promptRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStarted(true);
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setTyped(TEXT.slice(0, i));
      if (i >= TEXT.length) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [started]);

  const toggleExpanded = useCallback(() => setShowExpanded((v) => !v), []);

  return (
    <footer className="border-t border-[rgba(0,255,65,0.07)] bg-void">
      <div className="max-w-[1200px] mx-auto px-5 md:px-12 py-12">
        <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">
          <div className="max-w-xs">
            <Link href="/" className="inline-block no-underline">
              <Image src="/wordmark.svg" alt="CleanRoom" width={120} height={32} />
            </Link>
            <p className="mt-3 text-xs text-white-mid leading-relaxed">
              Virtual disposable browsers. Privacy-first. Pay with Monero. Auto-destructs when you&apos;re done.
            </p>
          </div>
          <div className="flex flex-wrap gap-7 items-start">
            {footerLinks.map((link) =>
              link.href.startsWith("http") ? (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs tracking-[0.1em] uppercase text-white-dim no-underline link-underline hover:text-foreground transition-colors"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-xs tracking-[0.1em] uppercase text-white-dim no-underline link-underline hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              )
            )}
          </div>
        </div>

        <div className="divider mb-8" />

        <div className="flex flex-col md:flex-row justify-between gap-4 text-[11px] text-white-dim">
          <span>&copy; {new Date().getFullYear()} CleanRoom. All rights reserved.</span>
          <span ref={promptRef} className="relative">
            {showExpanded ? (
              <span className="text-green/80 text-[10px] italic transition-all duration-300">
                Operated with respect for your privacy
              </span>
            ) : (
              <span className="text-green relative group/wrf">
                ~/
                <span
                  onClick={toggleExpanded}
                  className="relative cursor-pointer border-b border-dotted border-green/40"
                >
                  wrf
                  <span className="hidden md:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-[#0a0a0a] border border-green/20 text-[10px] text-green whitespace-nowrap opacity-0 group-hover/wrf:opacity-100 transition-opacity pointer-events-none clip-cut-tr">
                    Operated with respect for your privacy
                  </span>
                </span>
                &gt;{" "}
              </span>
            )}
            {!showExpanded && (
              <span className="text-white-mid">{typed}<span className="animate-pulse">_</span></span>
            )}
          </span>
        </div>
      </div>
    </footer>
  );
}
