"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { X } from "@phosphor-icons/react";

const DISMISS_KEY = "clnrm_survey_banner_dismissed";
const SUBMITTED_KEY = "clnrm_survey_submitted";

export function SurveyBanner() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  const isSessionPage = pathname?.startsWith("/session");

  useEffect(() => {
    if (isSessionPage) return;
    const timer = setTimeout(() => {
      const dismissed = localStorage.getItem(DISMISS_KEY) === "true";
      const submitted = localStorage.getItem(SUBMITTED_KEY) === "true";
      if (!dismissed && !submitted) {
        setVisible(true);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [isSessionPage]);

  if (!visible || isSessionPage) return null;

  return (
    <div className="survey-banner relative z-40 border-b border-green/12 bg-green/[0.03]">
      <div className="max-w-[1400px] mx-auto px-5 md:px-12 py-2.5 flex items-center justify-between gap-4">
        <p className="text-[11px] text-white-mid leading-[1.6]">
          Pre-launch &mdash;{" "}
          <Link
            href="/survey"
            className="text-green no-underline hover:underline font-bold"
            onClick={() => setVisible(false)}
          >
            take the 3-minute survey
          </Link>{" "}
          to shape CleanRoom&apos;s roadmap.
        </p>
        <button
          onClick={() => {
            localStorage.setItem(DISMISS_KEY, "true");
            setVisible(false);
          }}
          className="shrink-0 text-white-dim/40 hover:text-foreground transition-colors"
          aria-label="Dismiss survey banner"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
