"use client";

import { type RefObject } from "react";
import { ArrowSquareOut, ArrowRight } from "@phosphor-icons/react";
import type { VoucherListingPublic } from "@/lib/api/types";

export function CardDetailModal({
  listing,
  popoverRef,
  onClose,
  onConvertToXmr,
}: {
  listing: VoucherListingPublic;
  popoverRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onConvertToXmr: (listing: VoucherListingPublic) => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-void/60" onClick={onClose} />
      <div
        ref={popoverRef}
        className="fixed inset-0 z-50 flex items-center justify-center p-5"
      >
        <div className="w-full max-w-sm bg-surface border border-green/20 shadow-2xl clip-card p-5 max-h-[85vh] overflow-y-auto">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-xs font-bold text-foreground">{listing.platform_name}</div>
              <div className="text-lg font-bold text-green mt-1">
                ${listing.value_usd.toFixed(2)}
                {listing.value_xmr_display && (
                  <span className="text-[10px] text-white-dim font-normal ml-2">
                    ≈ {listing.value_xmr_display}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white-dim/40 hover:text-white-dim/80 text-sm leading-none mt-1"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-wrap gap-1 mb-4">
            {listing.accepted_payments.map((p) => (
              <span
                key={p}
                className="text-[8px] tracking-[0.1em] uppercase border border-white-dim/15 text-white-dim px-1.5 py-0.5"
              >
                {p}
              </span>
            ))}
          </div>

          <div className="bg-void border border-green/7 p-3 clip-cut-tr mb-4">
            <div className="text-[8px] tracking-[0.22em] uppercase text-white-dim mb-1.5">How this works</div>
            <ol className="text-[10px] text-white-mid leading-[1.8] space-y-0.5 list-decimal list-inside">
              <li>Buy on reseller site</li>
              <li>Receive code via email</li>
              <li>Sell code on P2P exchange for XMR</li>
              <li>Send XMR to address above ↑</li>
              <li>Balance credits automatically</li>
            </ol>
          </div>

          <div className="flex flex-col gap-2">
            <a
              href={listing.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="clip-spell flex items-center justify-center gap-1.5 bg-green-dim/20 border border-green/30 text-green text-[10px] font-bold tracking-[0.15em] uppercase px-3 py-2 transition-all hover:bg-green-dim/40"
            >
              <ArrowSquareOut size={12} />
              Buy on {listing.platform_name}
            </a>
            <button
              onClick={() => onConvertToXmr(listing)}
              className="clip-spell flex items-center justify-center gap-1.5 border border-green/40 text-green text-[10px] font-bold tracking-[0.15em] uppercase px-3 py-2 transition-all hover:bg-green-dim/30"
            >
              Convert to XMR
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
