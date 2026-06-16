"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { InfiniteScroll } from "@/components/infinite-scroll";
import { getVoucherListings, redeemVoucher } from "@/lib/api/voucher";
import { requestDepositAddress } from "@/lib/api/balance";
import type { VoucherListingPublic, BalanceDepositResponse } from "@/lib/api/types";
import { Input } from "@/components/ui/input";
import {
  Ticket,
  ArrowSquareOut,
  ArrowRight,
  Copy,
  Wallet,
  CurrencyCircleDollar,
  ShoppingCart,
  Spinner,
} from "@phosphor-icons/react";

const BALANCE_PID_KEY = "clnrm_balance_payment_id";
const BALANCE_DEPOSIT_KEY = "clnrm_balance_deposit";
const WIZARD_LISTING_KEY = "clnrm_wizard_listing";
const PAGE_SIZE = 12;

function useStep() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const raw = searchParams.get("step");
  const validSteps = ["browse", "convert", "deposit"] as const;
  type Step = (typeof validSteps)[number];
  const step: Step = validSteps.includes(raw as Step) ? (raw as Step) : "browse";

  const setStep = useCallback(
    (s: Step) => {
      const p = new URLSearchParams(searchParams.toString());
      p.set("step", s);
      router.push(`?${p.toString()}`, { scroll: false });
    },
    [searchParams, router],
  );

  return { step, setStep, stepIdx: validSteps.indexOf(step) };
}

export default function BuyVouchersPage() {
  return (
    <Suspense
      fallback={
        <div className="relative min-h-[calc(100vh-60px)] flex items-center justify-center">
          <Spinner size={20} className="text-green animate-spin" />
        </div>
      }
    >
      <BuyVouchersContent />
    </Suspense>
  );
}

function BuyVouchersContent() {
  const { step, setStep, stepIdx } = useStep();
  const [selectedListing, setSelectedListing] = useState<VoucherListingPublic | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Deposit state
  const [deposit, setDeposit] = useState<BalanceDepositResponse | null>(null);
  const [generatingDeposit, setGeneratingDeposit] = useState(false);

  // Popover state
  const [popoverListing, setPopoverListing] = useState<VoucherListingPublic | null>(null);
  const [popoverRect, setPopoverRect] = useState<DOMRect | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isHoverDevice, setIsHoverDevice] = useState(true);

  // Redeem state
  const [redeemCode, setRedeemCode] = useState("");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemResult, setRedeemResult] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // ── Restore saved state on mount ──
  useEffect(() => {
    const savedListing = localStorage.getItem(WIZARD_LISTING_KEY);
    if (savedListing) {
      try {
        setSelectedListing(JSON.parse(savedListing));
      } catch {}
    }
    const savedPid = localStorage.getItem(BALANCE_PID_KEY);
    if (savedPid) setPaymentId(savedPid);
    const savedDeposit = localStorage.getItem(BALANCE_DEPOSIT_KEY);
    if (savedDeposit) {
      try {
        const d = JSON.parse(savedDeposit) as BalanceDepositResponse;
        if (new Date(d.expires_at).getTime() > Date.now()) setDeposit(d);
        else localStorage.removeItem(BALANCE_DEPOSIT_KEY);
      } catch {
        localStorage.removeItem(BALANCE_DEPOSIT_KEY);
      }
    }
  }, []);

  // Persist selected listing
  useEffect(() => {
    if (selectedListing) localStorage.setItem(WIZARD_LISTING_KEY, JSON.stringify(selectedListing));
    else localStorage.removeItem(WIZARD_LISTING_KEY);
  }, [selectedListing]);

  // ── Paginated fetch ──
  const fetchListingsPage = useCallback(async (page: number) => {
    const res = await getVoucherListings(page, PAGE_SIZE);
    return { items: res.items, total_pages: res.total_pages, total: res.total };
  }, []);

  // ── Deposit ──
  const handleGenerateDeposit = useCallback(async () => {
    setGeneratingDeposit(true);
    setError(null);
    try {
      const d = await requestDepositAddress();
      setDeposit(d);
      setPaymentId(d.payment_id);
      localStorage.setItem(BALANCE_DEPOSIT_KEY, JSON.stringify(d));
      localStorage.setItem(BALANCE_PID_KEY, d.payment_id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate deposit address");
    } finally {
      setGeneratingDeposit(false);
    }
  }, []);

  // ── Redeem ──
  const handleRedeem = useCallback(async () => {
    if (!redeemCode.trim() || !paymentId) return;
    setRedeeming(true);
    setError(null);
    setRedeemResult(null);
    try {
      const res = await redeemVoucher(redeemCode.trim(), paymentId);
      setRedeemResult(
        `Redeemed $${res.value_usd} — ${res.value_xmr_display} credited. New balance: ${res.new_balance_xmr_display}`,
      );
      setRedeemCode("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to redeem code");
    } finally {
      setRedeeming(false);
    }
  }, [redeemCode, paymentId]);

  const handleCopy = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {}
  }, []);

  // ── Detect hover capability ──
  useEffect(() => {
    const check = () => {
      setIsHoverDevice(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Close popover on Escape ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setPopoverListing(null); setPopoverRect(null); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // ── Close popover on click outside ──
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverListing(null);
        setPopoverRect(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Close popover on scroll ──
  useEffect(() => {
    if (!popoverListing) return;
    const handler = () => { setPopoverListing(null); setPopoverRect(null); };
    window.addEventListener("scroll", handler, { once: true });
    return () => window.removeEventListener("scroll", handler);
  }, [popoverListing]);

  const clearHoverTimer = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);

  const showPopover = useCallback((listing: VoucherListingPublic, rect: DOMRect) => {
    clearHoverTimer();
    setPopoverListing(listing);
    setPopoverRect(rect);
  }, [clearHoverTimer]);

  const hidePopoverWithDelay = useCallback(() => {
    clearHoverTimer();
    hoverTimerRef.current = setTimeout(() => {
      setPopoverListing(null);
      setPopoverRect(null);
    }, 200);
  }, [clearHoverTimer]);

  const getPopoverStyle = useCallback((rect: DOMRect): React.CSSProperties => {
    const width = 300;
    const gap = 12;
    let left: number;
    if (rect.right + gap + width <= window.innerWidth) {
      left = rect.right + gap;
    } else if (rect.left - gap - width >= 0) {
      left = rect.left - gap - width;
    } else {
      left = Math.max(8, window.innerWidth - width - 8);
    }
    const top = Math.max(8, Math.min(rect.top, window.innerHeight - 350));
    return { left, top };
  }, []);

  const steps: { key: string; label: string; icon: React.ReactNode }[] = [
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
        {/* ── Header ── */}
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

        {/* ── Sticky deposit address bar ── */}
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
                  onClick={() => handleCopy(deposit.integrated_address, "addr")}
                  className="clip-spell inline-flex items-center gap-1 border border-green/30 text-green text-[9px] font-bold tracking-[0.15em] uppercase px-2.5 py-1 transition-all hover:bg-green-dim/20 shrink-0"
                >
                  <Copy size={10} />
                  {copied === "addr" ? "Copied" : "Copy"}
                </button>
              </>
            ) : (
              <button
                onClick={handleGenerateDeposit}
                disabled={generatingDeposit}
                className="clip-spell inline-flex items-center gap-1.5 border border-white-dim/25 text-white-mid text-[9px] font-bold tracking-[0.15em] uppercase px-3 py-1.5 transition-all hover:border-white-dim/50 hover:text-foreground disabled:opacity-40"
              >
                {generatingDeposit ? "..." : "Generate address"}
                <ArrowRight size={10} />
              </button>
            )}
          </div>
        </div>

        {/* ── Frog-foot tab bar ── */}
        <div className="mb-8">
          <div className="flex items-start justify-between relative">
            {steps.map((s, i) => {
              const isActive = step === s.key;
              const isDone = stepIdx > i;
              return (
                <button
                  key={s.key}
                  onClick={() => setStep(s.key as "browse" | "convert" | "deposit")}
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

          {/* Webbing SVG */}
          <div className="relative mt-1 mx-2 h-[18px]">
            <svg viewBox="0 0 100 18" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="web-fill-buy" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#00ff41" stopOpacity={stepIdx >= 0 ? 0.6 : 0.08} />
                  <stop offset="50%" stopColor="#00ff41" stopOpacity={stepIdx >= 1 ? 0.6 : 0.08} />
                  <stop offset="100%" stopColor="#00ff41" stopOpacity={stepIdx >= 2 ? 0.6 : 0.08} />
                </linearGradient>
              </defs>
              <path d="M0,10 Q15,2 33,10 Q50,18 67,10 Q85,2 100,10" fill="none" stroke="url(#web-fill-buy)" strokeWidth="1.5" />
              <path d="M0,14 Q15,6 33,14 Q50,22 67,14 Q85,6 100,14" fill="none" stroke="url(#web-fill-buy)" strokeWidth="0.5" opacity={0.4} />
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

        {/* ── Step 1: Browse ── */}
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
              <div
                className="flex flex-col relative group"
                onMouseEnter={(e) => {
                  if (isHoverDevice) {
                    showPopover(listing, e.currentTarget.getBoundingClientRect());
                  }
                }}
                onMouseLeave={() => {
                  if (isHoverDevice) hidePopoverWithDelay();
                }}
                onClick={(e) => {
                  if (!isHoverDevice) {
                    if (popoverListing?.id === listing.id) {
                      setPopoverListing(null);
                      setPopoverRect(null);
                    } else {
                      showPopover(listing, e.currentTarget.getBoundingClientRect());
                    }
                  }
                }}
              >
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
                  <div className="text-[10px] tracking-[0.1em] uppercase text-green/50 group-hover:text-green transition-colors mt-auto">
                    Details →
                  </div>
                </div>
              </div>
            )}
          />
        )}

        {/* ── Step 2: Convert ── */}
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
                    name="AgorDesk"
                    url="https://agoradesk.com"
                    description="P2P exchange with gift card trading. Create a sell offer, find a buyer, trade code for XMR. No KYC for small trades."
                    guides={[
                      "Create an account (no KYC required)",
                      "Post a sell offer for your gift card type",
                      "Wait for a buyer — trade code for XMR",
                      "Withdraw XMR to the deposit address above ↑",
                    ]}
                  />
                  <ExchangeCard
                    name="LocalMonero"
                    url="https://localmonero.co"
                    description="P2P Monero marketplace. Many gift card traders. Check buyer reputation before trading."
                    guides={[
                      "Browse or create a sell offer",
                      "Select gift card as payment method",
                      "Complete the trade — code for XMR",
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
                  onClick={() => handleCopy(deposit.integrated_address, "addr2")}
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

        {/* ── Step 3: Deposit ── */}
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
                      onClick={() => handleCopy(deposit.integrated_address, "addr3")}
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
                      onClick={() => handleCopy(deposit.payment_id, "pid")}
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

        {/* ── Redeem section ── */}
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

      {/* ── Card detail popover ── */}
      {popoverListing && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 md:bg-void/60"
            onClick={() => { setPopoverListing(null); setPopoverRect(null); }}
          />

          {/* Desktop: floating popover */}
          {popoverRect && (
            <div
              ref={popoverRef}
              onMouseEnter={clearHoverTimer}
              onMouseLeave={hidePopoverWithDelay}
              className="hidden md:block fixed z-50 w-[300px] bg-surface border border-green/20 shadow-2xl clip-card p-5"
              style={getPopoverStyle(popoverRect)}
            >
              <div className="text-xs font-bold text-foreground mb-1">{popoverListing.platform_name}</div>
              <div className="text-lg font-bold text-green mb-3">
                ${popoverListing.value_usd.toFixed(2)}
                {popoverListing.value_xmr_display && (
                  <span className="text-[10px] text-white-dim font-normal ml-2">≈ {popoverListing.value_xmr_display}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1 mb-4">
                {popoverListing.accepted_payments.map((p) => (
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
                  href={popoverListing.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="clip-spell flex items-center justify-center gap-1.5 bg-green-dim/20 border border-green/30 text-green text-[10px] font-bold tracking-[0.15em] uppercase px-3 py-2 transition-all hover:bg-green-dim/40"
                >
                  <ArrowSquareOut size={12} />
                  Buy on {popoverListing.platform_name}
                </a>
                <button
                  onClick={() => {
                    setSelectedListing(popoverListing);
                    setPopoverListing(null);
                    setPopoverRect(null);
                    setStep("convert");
                  }}
                  className="clip-spell flex items-center justify-center gap-1.5 border border-green/40 text-green text-[10px] font-bold tracking-[0.15em] uppercase px-3 py-2 transition-all hover:bg-green-dim/30"
                >
                  Convert to XMR
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          )}

          {/* Mobile: bottom sheet */}
          <div
            ref={popoverRef}
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-green/20 clip-cut-tr p-5 max-h-[70vh] overflow-y-auto animate-slide-up"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold text-foreground">{popoverListing.platform_name}</div>
              <button
                onClick={() => { setPopoverListing(null); setPopoverRect(null); }}
                className="text-white-dim/40 hover:text-white-dim/80 text-sm leading-none"
              >
                ✕
              </button>
            </div>
            <div className="text-lg font-bold text-green mb-3">
              ${popoverListing.value_usd.toFixed(2)}
              {popoverListing.value_xmr_display && (
                <span className="text-[10px] text-white-dim font-normal ml-2">≈ {popoverListing.value_xmr_display}</span>
              )}
            </div>
            <div className="flex flex-wrap gap-1 mb-4">
              {popoverListing.accepted_payments.map((p) => (
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
                href={popoverListing.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="clip-spell flex items-center justify-center gap-1.5 bg-green-dim/20 border border-green/30 text-green text-[10px] font-bold tracking-[0.15em] uppercase px-3 py-2 transition-all hover:bg-green-dim/40"
              >
                <ArrowSquareOut size={12} />
                Buy on {popoverListing.platform_name}
              </a>
              <button
                onClick={() => {
                  setSelectedListing(popoverListing);
                  setPopoverListing(null);
                  setPopoverRect(null);
                  setStep("convert");
                }}
                className="clip-spell flex items-center justify-center gap-1.5 border border-green/40 text-green text-[10px] font-bold tracking-[0.15em] uppercase px-3 py-2 transition-all hover:bg-green-dim/30"
              >
                Convert to XMR
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ExchangeCard({
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
