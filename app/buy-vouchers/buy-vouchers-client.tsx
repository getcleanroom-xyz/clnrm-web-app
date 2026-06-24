"use client";

import { useState, useEffect, useCallback } from "react";
import { InfiniteScroll } from "@/components/infinite-scroll";
import { getVoucherListings } from "@/lib/api/voucher";
import type { VoucherListingPublic } from "@/lib/api/types";
import { Input } from "@/components/ui/input";
import {
  Ticket,
  ArrowRight,
  Copy,
  Wallet,
  CurrencyCircleDollar,
  ShoppingCart,
} from "@phosphor-icons/react";
import { useStep, useDeposit, usePopover, WIZARD_LISTING_KEY } from "@/components/buy-vouchers/hooks";
import { useCopy } from "@/lib/hooks/use-copy";
import { redeemVoucher } from "@/lib/api/voucher";
import { toast } from "@/lib/toast";
import { StepTabs } from "@/components/buy-vouchers/step-tabs";
import { DepositAddressBar } from "@/components/buy-vouchers/deposit-address-bar";
import { CardDetailModal } from "@/components/buy-vouchers/card-detail-modal";
import { ExchangeCard } from "@/components/buy-vouchers/exchange-card";

const PAGE_SIZE = 12;

export default function BuyVouchersClient() {
  const { step, setStep, stepIdx } = useStep();
  const [selectedListing, setSelectedListing] = useState<VoucherListingPublic | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = localStorage.getItem(WIZARD_LISTING_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [error, setError] = useState<string | null>(null);

  const { deposit, generatingDeposit, paymentId, generateDeposit } = useDeposit();
  const { popoverListing, popoverRef, setPopoverListing, togglePopover } = usePopover();
  const { copied, copy } = useCopy();

  // Redeem state
  const [redeemCode, setRedeemCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redeemResult, setRedeemResult] = useState<string | null>(null);

  // Persist selected listing
  useEffect(() => {
    if (selectedListing) localStorage.setItem(WIZARD_LISTING_KEY, JSON.stringify(selectedListing));
    else localStorage.removeItem(WIZARD_LISTING_KEY);
  }, [selectedListing]);

  // Paginated fetch
  const fetchListingsPage = useCallback(async (page: number) => {
    const res = await getVoucherListings(page, PAGE_SIZE);
    return { items: res.items, total_pages: res.total_pages, total: res.total };
  }, []);

  // Deposit
  const handleGenerateDeposit = useCallback(async () => {
    setError(null);
    try {
      await generateDeposit();
      toast.success("Deposit address generated. Send any amount of XMR.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to generate deposit address";
      setError(message);
      toast.error(message);
    }
  }, [generateDeposit]);

  // Redeem
  const handleRedeem = useCallback(async () => {
    if (!redeemCode.trim() || !paymentId) return;
    setRedeeming(true);
    setError(null);
    setRedeemResult(null);
    try {
      const res = await redeemVoucher(redeemCode.trim(), paymentId);
      const msg = `Redeemed $${res.value_usd} — ${res.value_xmr_display} credited.`;
      setRedeemResult(msg);
      setRedeemCode("");
      toast.success(msg);
      if (res.balance_token) {
        try { localStorage.setItem("clnrm_balance_token", res.balance_token); } catch {}
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to redeem code";
      setError(message);
      toast.error(message);
    } finally {
      setRedeeming(false);
    }
  }, [redeemCode, paymentId]);

  // Convert to XMR from modal
  const handleConvertToXmr = useCallback(
    (listing: VoucherListingPublic) => {
      setSelectedListing(listing);
      setPopoverListing(null);
      setStep("convert");
    },
    [setStep, setPopoverListing],
  );

  const steps = [
    { key: "browse", label: "Browse", icon: <ShoppingCart size={14} /> },
    { key: "convert", label: "Convert", icon: <CurrencyCircleDollar size={14} /> },
    { key: "deposit", label: "Deposit", icon: <Wallet size={14} /> },
  ];

  return (
    <div className="relative min-h-[calc(100vh-60px)] py-16 px-5 overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 50% 60% at 50% 20%, rgba(0,59,15,0.18) 0%, transparent 65%)",
        }}
      />
      <div className="absolute inset-0 pointer-events-none grid-bg-sm" />

      <div className="relative z-10 max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[22px] font-bold mb-1">Buy Vouchers</h1>
          <p className="text-xs text-white-mid leading-[1.75] max-w-[600px]">
            Buy gift cards with fiat, convert to Monero, and fund your balance.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 border border-error/30 bg-error/10 text-error text-xs clip-cut-tr">
            {error}
          </div>
        )}

        <DepositAddressBar
          deposit={deposit}
          generatingDeposit={generatingDeposit}
          copied={copied}
          onCopy={copy}
          onGenerate={handleGenerateDeposit}
        />

        <StepTabs steps={steps} step={step} setStep={setStep} stepIdx={stepIdx} />

        {/* Step 1: Browse */}
        {step === "browse" && (
          <InfiniteScroll
            fetchPage={fetchListingsPage}
            pageSize={PAGE_SIZE}
            keyExtractor={(l) => l.id}
            gridCols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            hibernationPages={2}
            emptyState={
              <div className="text-center py-16 border border-dashed border-white-dim/10 clip-card">
                <ShoppingCart size={32} className="text-white-dim/20 mx-auto mb-3" />
                <p className="text-sm text-white-dim">No listings available yet.</p>
                <p className="text-xs text-white-mid mt-1">Check back soon.</p>
              </div>
            }
            renderItem={(listing) => (
              <div className="flex flex-col relative group">
                <div className="w-full bg-surface border border-green/10 p-6 clip-card flex flex-col text-left relative transition-all duration-200 cursor-pointer hover:border-green/25 hover:bg-green/[0.02]">
                  {listing.featured && (
                    <div className="absolute -top-px -right-px">
                      <div className="bg-green text-void text-[8px] tracking-[0.2em] uppercase font-bold px-3 py-1 clip-[polygon(0_0,100%_0,100%_100%,8px_100%)]">
                        Featured
                      </div>
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-xs font-bold text-foreground">{listing.platform_name}</div>
                      <div className="text-[22px] font-bold text-green mt-1 [text-shadow:0_0_20px_rgba(0,255,65,0.2)]">
                        ${listing.value_usd.toFixed(2)}
                      </div>
                      {listing.value_xmr_display && (
                        <div className="text-[10px] text-white-dim mt-0.5">≈ {listing.value_xmr_display}</div>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-white-mid leading-[1.7] mb-4 flex-1 line-clamp-3">
                    {listing.description}
                  </p>
                  <button
                    data-details-trigger
                    onClick={() => togglePopover(listing)}
                    className="text-[10px] tracking-[0.1em] uppercase text-green/50 hover:text-green transition-colors mt-auto text-left"
                  >
                    Details →
                  </button>
                </div>
              </div>
            )}
          />
        )}

        {/* Step 2: Convert */}
        {step === "convert" && (
          <div className="w-full bg-surface border border-green/12 p-8 sm:p-10 clip-card">
            <div className="flex items-center gap-2 mb-1">
              <CurrencyCircleDollar size={16} className="text-green" />
              <span className="section-label mb-0">Convert to XMR</span>
            </div>

            {selectedListing ? (
              <>
                <p className="text-xs text-white-mid leading-[1.75] mt-2 mb-6">
                  You bought <span className="text-green font-bold">{selectedListing.title}</span> and
                  received a code. Sell that code for XMR on a P2P exchange, then send it to your
                  deposit address shown at the top of this page.
                </p>
                <div className="space-y-4">
                  <ExchangeCard
                    name="XMRBazaar"
                    url="https://xmrbazaar.com"
                    description="Web-based Monero marketplace with gift card trading. Post your code, find a buyer, settle in XMR. No fees, optional escrow."
                    guides={[
                      "Create a free account (no email or ID needed)",
                      "Post a sell listing for your gift card",
                      "Negotiate with buyers via encrypted chat",
                      "Use 2-of-3 multisig escrow for safety",
                      "Withdraw XMR to the deposit address above ↑",
                    ]}
                  />
                  <ExchangeCard
                    name="Haveno"
                    url="https://haveno.exchange"
                    description="Decentralized P2P exchange with built-in escrow. Desktop app (Tor required). Supports gift card trades."
                    guides={[
                      "Download the Haveno desktop app",
                      "Connect via Tor (built-in, no config needed)",
                      "Create a sell offer for your gift card type",
                      "Complete the trade — code via chat for XMR",
                      "Send XMR to the deposit address above ↑",
                    ]}
                  />
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <CurrencyCircleDollar size={32} className="text-white-dim/20 mx-auto mb-3" />
                <p className="text-sm text-white-dim mb-1">No gift card selected</p>
                <p className="text-xs text-white-mid mb-5">Go to Browse and pick a gift card first.</p>
                <button
                  onClick={() => setStep("browse")}
                  className="clip-spell inline-flex items-center gap-1.5 bg-green-dim/30 border border-green/40 text-green text-xs font-bold tracking-[0.15em] uppercase px-5 py-2.5 transition-all hover:bg-green-dim/50 hover:border-green"
                >
                  Browse gift cards
                  <ArrowRight size={14} />
                </button>
              </div>
            )}

            {/* Address reminder */}
            {deposit ? (
              <div className="mt-6 flex items-start gap-3 p-4 border border-green/8 bg-green/[0.02] clip-cut-tr">
                <div className="w-0.5 shrink-0 self-stretch bg-green" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-green mb-1">Your deposit address</div>
                  <code className="text-[11px] text-green/70 break-all leading-[1.7] block font-mono">
                    {deposit.integrated_address}
                  </code>
                </div>
                <button
                  onClick={() => copy(deposit.integrated_address, "addr2")}
                  className="clip-spell shrink-0 inline-flex items-center gap-1 border border-green/30 text-green text-[9px] font-bold tracking-[0.15em] uppercase px-2.5 py-1.5 transition-all hover:bg-green-dim/20"
                >
                  <Copy size={10} />
                  {copied === "addr2" ? "Done" : "Copy"}
                </button>
              </div>
            ) : (
              <div className="mt-6 p-4 border border-yellow/20 bg-yellow/5 clip-cut-tr">
                <p className="text-[11px] text-yellow">
                  Generate a deposit address from the bar at the top of the page before you trade.
                </p>
              </div>
            )}

            <div className="mt-4">
              <button
                onClick={() => setStep("browse")}
                className="text-[10px] tracking-[0.1em] uppercase text-white-dim hover:text-white-dim/80 transition-colors"
              >
                ← Back to browse
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Deposit */}
        {step === "deposit" && (
          <div className="w-full bg-surface border border-green/12 p-8 sm:p-10 clip-card">
            <div className="flex items-center gap-2 mb-1">
              <Wallet size={16} className="text-green" />
              <span className="section-label mb-0">Deposit XMR</span>
            </div>
            <p className="text-xs text-white-mid leading-[1.75] mt-2 mb-6">
              Send XMR from your exchange wallet to this address. After one confirmation (~2 min), your balance credits automatically.
            </p>

            {deposit ? (
              <>
                <div className="bg-void border border-green/14 p-5 mb-5 clip-cut-tr">
                  <div className="text-[9px] tracking-[0.22em] uppercase text-white-dim mb-2.5">Deposit address</div>
                  <div className="text-[11px] text-green tracking-[0.04em] break-all leading-[1.9] font-mono">
                    {deposit.integrated_address}
                  </div>
                  <div className="flex justify-end mt-3">
                    <button
                      onClick={() => copy(deposit.integrated_address, "addr3")}
                      className="clip-spell inline-flex items-center gap-1.5 border border-white-dim/30 text-white-mid text-[10px] font-bold tracking-[0.15em] uppercase px-3 py-1.5 transition-all hover:border-white-dim/60 hover:text-foreground"
                    >
                      <Copy size={12} />
                      {copied === "addr3" ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
                <div className="bg-void border border-green/7 p-4 mb-5 clip-cut-tr">
                  <div className="text-[9px] tracking-[0.22em] uppercase text-white-dim mb-1.5">Payment ID (save this)</div>
                  <div className="text-[11px] text-green tracking-[0.04em] break-all leading-[1.9] font-mono">
                    {deposit.payment_id}
                  </div>
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => copy(deposit.payment_id, "pid")}
                      className="clip-spell inline-flex items-center gap-1.5 border border-white-dim/30 text-white-mid text-[10px] font-bold tracking-[0.15em] uppercase px-3 py-1.5 transition-all hover:border-white-dim/60 hover:text-foreground"
                    >
                      <Copy size={12} />
                      {copied === "pid" ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleGenerateDeposit}
                    disabled={generatingDeposit}
                    className="clip-spell flex-1 inline-flex items-center justify-center gap-1.5 border border-white-dim/30 text-white-mid text-xs font-bold tracking-[0.15em] uppercase px-4 py-2.5 transition-all hover:border-white-dim/60 hover:text-foreground disabled:opacity-40"
                  >
                    {generatingDeposit ? "..." : "Generate new address"}
                  </button>
                  <a
                    href="/balance"
                    className="clip-spell flex-1 inline-flex items-center justify-center gap-1.5 bg-green-dim/30 border border-green/40 text-green text-xs font-bold tracking-[0.15em] uppercase px-4 py-2.5 transition-all hover:bg-green-dim/50 hover:border-green"
                  >
                    Check balance
                    <ArrowRight size={14} />
                  </a>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Wallet size={32} className="text-white-dim/20 mx-auto mb-3" />
                <p className="text-sm text-white-dim mb-1">No deposit address yet</p>
                <p className="text-xs text-white-mid mb-5">
                  Generate one from the bar at the top or click below.
                </p>
                <button
                  onClick={handleGenerateDeposit}
                  disabled={generatingDeposit}
                  className="clip-spell inline-flex items-center gap-1.5 bg-green-dim/30 border border-green/40 text-green text-xs font-bold tracking-[0.15em] uppercase px-6 py-3 transition-all hover:bg-green-dim/50 hover:border-green disabled:opacity-40"
                >
                  {generatingDeposit ? "Generating..." : "Generate deposit address"}
                  <ArrowRight size={14} />
                </button>
              </div>
            )}

            <div className="mt-4">
              <button
                onClick={() => setStep("convert")}
                className="text-[10px] tracking-[0.1em] uppercase text-white-dim hover:text-white-dim/80 transition-colors"
              >
                ← Back to convert
              </button>
            </div>
          </div>
        )}

        {/* Redeem section */}
        <details className="mt-10 group">
          <summary className="text-xs text-white-dim/50 hover:text-white-dim/80 transition-colors cursor-pointer tracking-[0.1em] uppercase select-none flex items-center gap-2">
            <Ticket size={12} />
            Have a CleanRoom code?
            <span className="text-white-dim/20 ml-1">[+]</span>
          </summary>
          <div className="mt-4 w-full bg-surface border border-green/12 p-6 sm:p-8 clip-card">
            <p className="text-xs text-white-mid mb-4">
              Enter a voucher code from an admin or promotion to credit your balance.
            </p>
            <div className="flex gap-2 flex-col sm:flex-row">
              <Input
                placeholder="e.g. CR-XXXX-XXXX-XXXX-XXXX"
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value)}
                className="flex-1 font-mono tracking-wider"
              />
              <button
                onClick={handleRedeem}
                disabled={redeeming || !redeemCode.trim()}
                className="clip-spell inline-flex items-center justify-center gap-1.5 bg-green-dim/30 border border-green/40 text-green text-xs font-bold tracking-[0.15em] uppercase px-5 py-2 transition-all hover:bg-green-dim/50 hover:border-green disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                {redeeming ? "Redeeming..." : "Redeem"}
                <ArrowRight size={14} />
              </button>
            </div>
            {redeemResult && (
              <div className="mt-3 p-3 border border-green/30 bg-green/10 text-green text-xs clip-cut-tr">
                {redeemResult}
              </div>
            )}
            {!paymentId && (
              <div className="mt-4 p-3 border border-green/8 bg-green/[0.02] clip-cut-tr">
                <p className="text-[11px] text-white-mid">
                  Go to the{" "}
                  <a href="/balance" className="text-green underline">
                    Balance page
                  </a>{" "}
                  to set up a payment ID first.
                </p>
              </div>
            )}
          </div>
        </details>
      </div>

      {/* Card detail modal */}
      {popoverListing && (
        <CardDetailModal
          listing={popoverListing}
          popoverRef={popoverRef}
          onClose={() => setPopoverListing(null)}
          onConvertToXmr={handleConvertToXmr}
        />
      )}
    </div>
  );
}
