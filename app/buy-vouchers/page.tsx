"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { getVoucherListings, redeemVoucher } from "@/lib/api/voucher";
import type { VoucherListingPublic } from "@/lib/api/types";
import { ArrowRight, Ticket, Tag, ShoppingCart, ArrowSquareOut, Spinner } from "@phosphor-icons/react";

const BALANCE_PID_KEY = "clnrm_balance_payment_id";

export default function BuyVouchersPage() {
  const [listings, setListings] = useState<VoucherListingPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterPayment, setFilterPayment] = useState<string | null>(null);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redeemResult, setRedeemResult] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function fetchListings() {
    setLoading(true);
    setError(null);
    try {
      const res = await getVoucherListings();
      setListings(res.listings);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load listings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setTimeout(() => {
      fetchListings();
      const pid = localStorage.getItem(BALANCE_PID_KEY);
      if (pid) {
        setPaymentId(pid);
      }
    }, 0);
  }, []);

  const handleRedeem = useCallback(async () => {
    if (!redeemCode.trim()) return;
    const pid = paymentId;

    if (!pid) {
      setError("No payment ID found. Generate a deposit address on the Balance page first.");
      return;
    }

    setRedeeming(true);
    setError(null);
    setRedeemResult(null);
    try {
      const res = await redeemVoucher(redeemCode.trim(), pid);
      setRedeemResult(
        `Redeemed $${res.value_usd} — ${res.value_xmr_display} credited. ` +
        `New balance: ${res.new_balance_xmr_display}`
      );
      setRedeemCode("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to redeem code");
    } finally {
      setRedeeming(false);
    }
  }, [redeemCode, paymentId]);

  const allPaymentMethods = [...new Set(listings.flatMap((l) => l.accepted_payments))].sort();
  const filtered = filterPayment
    ? listings.filter((l) => l.accepted_payments.includes(filterPayment))
    : listings;

  const handleCopy = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {}
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-60px)] py-20 px-5 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 50% 60% at 50% 20%, rgba(0,59,15,0.18) 0%, transparent 65%)",
        }}
      />
      <div className="absolute inset-0 pointer-events-none grid-bg-sm" />

      <div className="relative z-10 max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-[22px] font-bold mb-2">Buy Vouchers</h1>
          <p className="text-xs text-white-mid leading-[1.75] max-w-[600px]">
            Purchase CleanRoom credit from third-party resellers using whatever payment method works for you.
            Enter a code below if you already have one.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 border border-error/30 bg-error/10 text-error text-xs clip-cut-tr">
            {error}
          </div>
        )}

        {redeemResult && (
          <div className="mb-6 p-3 border border-green/30 bg-green/10 text-green text-xs clip-cut-tr">
            {redeemResult}
          </div>
        )}

        {/* Redeem section */}
        <div className="w-full bg-surface border border-green/12 p-6 sm:p-8 clip-card mb-10">
          <div className="flex items-center gap-2 mb-1">
            <Ticket size={16} className="text-green" />
            <span className="section-label mb-0">Have a code?</span>
          </div>
          <p className="text-xs text-white-mid mb-4 mt-2">
            Enter your voucher code below to credit your balance. You need a payment ID —{" "}
            <a href="/balance" className="text-green underline">create one on the Balance page</a> if you haven&apos;t yet.
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
          {paymentId && (
            <div className="mt-3 flex items-center gap-2 text-[10px] text-white-dim">
              <span>Using payment ID:</span>
              <code className="text-green text-[9px]">{paymentId.slice(0, 16)}...</code>
              <button
                onClick={() => handleCopy(paymentId, "pid")}
                className="text-green hover:underline"
              >
                {copied === "pid" ? "Copied" : "Copy"}
              </button>
            </div>
          )}
        </div>

        {/* Filter bar */}
        {allPaymentMethods.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <Tag size={14} className="text-white-dim shrink-0" />
            <button
              onClick={() => setFilterPayment(null)}
              className={`text-[10px] tracking-[0.1em] uppercase px-3 py-1.5 border transition-all ${
                !filterPayment
                  ? "border-green/40 text-green bg-green-dim/20"
                  : "border-white-dim/20 text-white-dim hover:border-white-dim/40"
              }`}
            >
              All
            </button>
            {allPaymentMethods.map((m) => (
              <button
                key={m}
                onClick={() => setFilterPayment(m)}
                className={`text-[10px] tracking-[0.1em] uppercase px-3 py-1.5 border transition-all ${
                  filterPayment === m
                    ? "border-green/40 text-green bg-green-dim/20"
                    : "border-white-dim/20 text-white-dim hover:border-white-dim/40"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        )}

        {/* Listings grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size={20} className="text-green animate-spin" />
            <span className="ml-2 text-xs text-white-dim">Loading listings...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-white-dim/10 clip-card">
            <ShoppingCart size={32} className="text-white-dim/20 mx-auto mb-3" />
            <p className="text-sm text-white-dim">No listings available yet.</p>
            <p className="text-xs text-white-mid mt-1">Check back soon for new voucher options.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((listing) => (
              <div
                key={listing.id}
                className="bg-surface border border-green/10 p-6 clip-card flex flex-col relative hover:border-green/25 transition-colors"
              >
                {listing.featured && (
                  <div className="absolute -top-px -right-px">
                    <div className="bg-green text-void text-[8px] tracking-[0.2em] uppercase font-bold px-3 py-1 clip-[polygon(0_0,100%_0,100%_100%,8px_100%)]">
                      Featured
                    </div>
                  </div>
                )}

                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-xs font-bold text-foreground">
                      {listing.platform_name}
                    </div>
                    <div className="text-[22px] font-bold text-green mt-1 [text-shadow:0_0_20px_rgba(0,255,65,0.2)]">
                      ${listing.value_usd.toFixed(2)}
                    </div>
                    {listing.value_xmr_display && (
                      <div className="text-[10px] text-white-dim mt-0.5">
                        ≈ {listing.value_xmr_display}
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-white-mid leading-[1.7] mb-4 flex-1">
                  {listing.description}
                </p>

                <div className="mb-4">
                  <div className="text-[9px] tracking-[0.15em] uppercase text-white-dim mb-2">
                    Accepted payments
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {listing.accepted_payments.map((p) => (
                      <span
                        key={p}
                        className="text-[9px] tracking-[0.1em] uppercase border border-white-dim/15 text-white-dim px-2 py-0.5"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                <a
                  href={listing.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="clip-spell w-full inline-flex items-center justify-center gap-1.5 bg-green-dim/20 border border-green/30 text-green text-[11px] font-bold tracking-[0.15em] uppercase px-4 py-2.5 transition-all hover:bg-green-dim/40 hover:border-green mt-auto"
                >
                  <ArrowSquareOut size={14} />
                  Purchase
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Payment ID reminder */}
        {!paymentId && !loading && (
          <div className="mt-10 p-4 border border-green/10 bg-green/[0.02] clip-cut-tr text-center">
            <p className="text-xs text-white-mid mb-3">
              You need a payment ID to receive credited funds. Create one on the Balance page.
            </p>
            <a
              href="/balance"
              className="clip-spell inline-flex items-center gap-1.5 bg-green-dim/30 border border-green/40 text-green text-xs font-bold tracking-[0.15em] uppercase px-5 py-2.5 transition-all hover:bg-green-dim/50 hover:border-green"
            >
              Go to Balance
              <ArrowRight size={14} />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
