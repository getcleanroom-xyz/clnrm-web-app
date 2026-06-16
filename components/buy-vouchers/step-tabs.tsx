"use client";

import type { ReactNode } from "react";
import type { Step } from "./hooks";

export function StepTabs({
  steps,
  step,
  setStep,
  stepIdx,
}: {
  steps: { key: string; label: string; icon: ReactNode }[];
  step: Step;
  setStep: (s: Step) => void;
  stepIdx: number;
}) {
  return (
    <div className="mb-8">
      <div className="flex items-start justify-between relative">
        {steps.map((s, i) => {
          const isActive = step === s.key;
          const isDone = stepIdx > i;
          return (
            <button
              key={s.key}
              onClick={() => setStep(s.key as Step)}
              className="flex flex-col items-center gap-1.5 relative z-10 group"
            >
              <div
                className={`w-10 h-10 flex items-center justify-center border transition-all duration-300 ${
                  isActive
                    ? "border-green bg-green-dim/20 text-green"
                    : isDone
                      ? "border-green/50 bg-green-dim/10 text-green/60"
                      : "border-white-dim/15 text-white-dim/40 hover:border-white-dim/30 hover:text-white-dim/70"
                }`}
                style={{ clipPath: "polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)" }}
              >
                {s.icon}
              </div>
              <span
                className={`text-[9px] tracking-[0.2em] uppercase whitespace-nowrap ${
                  isActive
                    ? "text-green font-bold"
                    : isDone
                      ? "text-green/50"
                      : "text-white-dim/40"
                }`}
              >
                {s.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="relative mt-1 mx-2 h-[18px]">
        <svg viewBox="0 0 100 18" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="web-fill" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#00ff41" stopOpacity={stepIdx >= 0 ? 0.6 : 0.08} />
              <stop offset="50%" stopColor="#00ff41" stopOpacity={stepIdx >= 1 ? 0.6 : 0.08} />
              <stop offset="100%" stopColor="#00ff41" stopOpacity={stepIdx >= 2 ? 0.6 : 0.08} />
            </linearGradient>
          </defs>
          <path d="M0,10 Q15,2 33,10 Q50,18 67,10 Q85,2 100,10" fill="none" stroke="url(#web-fill)" strokeWidth="1.5" />
          <path d="M0,14 Q15,6 33,14 Q50,22 67,14 Q85,6 100,14" fill="none" stroke="url(#web-fill)" strokeWidth="0.5" opacity={0.4} />
        </svg>
        <div className="absolute inset-0 flex justify-between items-center px-[3px]">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-[3px] h-[3px] rounded-full transition-colors duration-500 ${i <= stepIdx ? "bg-green" : "bg-white-dim/10"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
