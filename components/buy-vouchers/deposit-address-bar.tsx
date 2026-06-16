"use client";

import { Copy, ArrowRight } from "@phosphor-icons/react";
import type { BalanceDepositResponse } from "@/lib/api/types";

export function DepositAddressBar({
  deposit,
  generatingDeposit,
  copied,
  onCopy,
  onGenerate,
}: {
  deposit: BalanceDepositResponse | null;
  generatingDeposit: boolean;
  copied: string | null;
  onCopy: (text: string, label: string) => void;
  onGenerate: () => void;
}) {
  return (
    <div className="sticky top-0 z-20 -mx-5 px-5 py-3 bg-void/90 backdrop-blur-md border-b border-green/10 mb-6">
      <div className="max-w-[1200px] mx-auto flex items-center justify-end gap-3">
        {deposit ? (
          <>
            <code className="text-[10px] text-green font-mono tracking-[0.04em] truncate min-w-0 max-w-[260px] hidden sm:block">
              {deposit.integrated_address}
            </code>
            <code className="text-[10px] text-green font-mono tracking-[0.04em] truncate min-w-0 sm:hidden max-w-[160px]">
              {deposit.integrated_address.slice(0, 24)}...
            </code>
            <button
              onClick={() => onCopy(deposit.integrated_address, "addr")}
              className="clip-spell inline-flex items-center gap-1 border border-green/30 text-green text-[9px] font-bold tracking-[0.15em] uppercase px-2.5 py-1 transition-all hover:bg-green-dim/20 shrink-0"
            >
              <Copy size={10} />
              {copied === "addr" ? "Copied" : "Copy"}
            </button>
          </>
        ) : (
          <button
            onClick={onGenerate}
            disabled={generatingDeposit}
            className="clip-spell inline-flex items-center gap-1.5 border border-white-dim/25 text-white-mid text-[9px] font-bold tracking-[0.15em] uppercase px-3 py-1.5 transition-all hover:border-white-dim/50 hover:text-foreground disabled:opacity-40"
          >
            {generatingDeposit ? "..." : "Generate address"}
            <ArrowRight size={10} />
          </button>
        )}
      </div>
    </div>
  );
}
