"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { List, X } from "@phosphor-icons/react";

const links = [
  { href: "/", label: "Home" },
  { href: "/payment", label: "New Session" },
  { href: "/survey", label: "Survey" },
  { href: "/submissions", label: "Live Feed" },
  { href: "https://api.getcleanroom.xyz/docs", label: "API" },
];

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-[60px] border-b border-[rgba(0,255,65,0.09)] bg-[rgba(10,10,10,0.94)] backdrop-blur-[16px] px-5 md:px-12 flex items-center justify-between">
      <Link href="/" className="text-[17px] font-bold tracking-[0.15em] uppercase text-green no-underline">
        <span className="text-white-dim font-normal">&gt; </span>CLNRM
      </Link>

      <nav className="hidden md:flex items-center gap-8">
        {links.map((link) =>
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
      </nav>

      <button
        className="md:hidden text-white-dim hover:text-foreground transition-colors"
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
      >
        {open ? <X size={20} /> : <List size={20} />}
      </button>

      <div
        className={cn(
          "fixed top-[60px] left-0 right-0 bg-[rgba(10,10,10,0.97)] backdrop-blur-[16px] border-b border-[rgba(0,255,65,0.09)] transition-all duration-300 overflow-hidden md:hidden",
          open ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <nav className="flex flex-col p-5 gap-4">
          {links.map((link) =>
            link.href.startsWith("http") ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs tracking-[0.1em] uppercase text-white-dim no-underline hover:text-foreground transition-colors"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="text-xs tracking-[0.1em] uppercase text-white-dim no-underline hover:text-foreground transition-colors"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
