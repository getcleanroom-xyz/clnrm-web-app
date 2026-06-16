"use client";

import { ArrowSquareOut } from "@phosphor-icons/react";

export function ExchangeCard({
  name,
  url,
  description,
  guides,
}: {
  name: string;
  url: string;
  description: string;
  guides: string[];
}) {
  return (
    <div className="bg-void border border-green/8 p-5 clip-cut-tr">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-xs font-bold text-foreground">{name}</div>
          <div className="text-[11px] text-white-mid leading-[1.7] mt-1">{description}</div>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="clip-spell shrink-0 inline-flex items-center gap-1 border border-green/30 text-green text-[9px] font-bold tracking-[0.15em] uppercase px-3 py-1.5 transition-all hover:bg-green-dim/20"
        >
          Visit
          <ArrowSquareOut size={10} />
        </a>
      </div>
      <div>
        <div className="text-[9px] tracking-[0.15em] uppercase text-white-dim mb-2">Steps</div>
        <ol className="text-[11px] text-white-mid leading-[1.9] space-y-1 list-decimal list-inside">
          {guides.map((g, i) => (
            <li key={i}>{g}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
