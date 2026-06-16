"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
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
  Check,
  CaretLeft,
  CaretRight,
  Spinner,
  ShoppingCart,
  Wallet,
  CurrencyCircleDollar,
  X,
} from "@phosphor-icons/react";

const BALANCE_PID_KEY = "clnrm_balance_payment_id";
const BALANCE_DEPOSIT_KEY = "clnrm_balance_deposit";
const WIZARD_STEP_KEY = "clnrm_wizard_step";
const WIZARD_LISTING_KEY = "clnrm_wizard_listing";

type WizardStep = "browse" | "convert" | "deposit";

export default function BuyVouchersPage() {
  const [listings, setListings] = useState<VoucherListingPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Wizard state
  const [step, setStep] = useState<WizardStep>("browse");
  const [selectedListing, setSelectedListing] = useState<VoucherListingPublic | null>(null);

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerListing, setDrawerListing] = useState<VoucherListingPublic | null>(null);

  // Deposit state
  const [deposit, setDeposit] = useState<BalanceDepositResponse | null>(null);
  const [generatingDeposit, setGeneratingDeposit] = useState(false);

  // Redeem state
  const [redeemCode, setRedeemCode] = useState("");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemResult, setRedeemResult] = useState<string | null>(null);

  // Copied state
  const [copied, setCopied] = useState<string | null>(null);

  // ── Fetch listings ──
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

  // ── Restore state on mount ──
  useEffect(() => {
    setTimeout(() => {
      fetchListings();

      const savedStep = localStorage.getItem(WIZARD_STEP_KEY) as WizardStep | null;
      if (savedStep && ["browse", "convert", "deposit"].includes(savedStep)) {
        setStep(savedStep);
      }

      const savedListing = localStorage.getItem(WIZARD_LISTING_KEY);
      if (savedListing) {
        try {
          setSelectedListing(JSON.parse(savedListing));
        } catch {}
      }

      const savedPid = localStorage.getItem(BALANCE_PID_KEY);
      if (savedPid) {
        setPaymentId(savedPid);
      }

      const savedDeposit = localStorage.getItem(BALANCE_DEPOSIT_KEY);
      if (savedDeposit) {
        try {
          const d = JSON.parse(savedDeposit) as BalanceDepositResponse;
          if (new Date(d.expires_at).getTime() > Date.now()) {
            setDeposit(d);
          } else {
            localStorage.removeItem(BALANCE_DEPOSIT_KEY);
          }
        } catch {
          localStorage.removeItem(BALANCE_DEPOSIT_KEY);
        }
      }
    }, 0);
  }, []);

  // ── Persist wizard state ──
  useEffect(() => {
    localStorage.setItem(WIZARD_STEP_KEY, step);
  }, [step]);

  useEffect(() => {
    if (selectedListing) {
      localStorage.setItem(WIZARD_LISTING_KEY, JSON.stringify(selectedListing));
    } else {
      localStorage.removeItem(WIZARD_LISTING_KEY);
    }
  }, [selectedListing]);

  // ── Step handlers ──
  const goToStep = useCallback((s: WizardStep) => {
    setStep(s);
    setError(null);
  }, []);

  // ── Drawer handlers ──
  const openDrawer = useCallback((listing: VoucherListingPublic) => {
    setDrawerListing(listing);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setTimeout(() => setDrawerListing(null), 200);
  }, []);

  const markPurchased = useCallback(() => {
    if (drawerListing) {
      setSelectedListing(drawerListing);
      closeDrawer();
      goToStep("convert");
    }
  }, [drawerListing, closeDrawer, goToStep]);

  const handleMarkConverted = useCallback(() => {
    goToStep("deposit");
  }, [goToStep]);

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
        `Redeemed $${res.value_usd} — ${res.value_xmr_display} credited. New balance: ${res.new_balance_xmr_display}`
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

  // ── Payment methods (for filters) ──
  const allPaymentMethods = [...new Set(listings.flatMap((l) => l.accepted_payments))].sort();
  const [filterPayment, setFilterPayment] = useState<string | null>(null);
  const filtered = filterPayment
    ? listings.filter((l) => l.accepted_payments.includes(filterPayment))
    : listings;

  const stepIdx = step === "browse" ? 0 : step === "convert" ? 1 : 2;
  const steps: { key: WizardStep; label: string; icon: ReactNode }[] = [
    { key: "browse", label: "Browse", icon: <ShoppingCart size={14} /> },
    { key: "convert", label: "Convert", icon: <CurrencyCircleDollar size={14} /> },
    { key: "deposit", label: "Deposit", icon: <Wallet size={14} /> },
  ];

  return (
    <div className="relative min-h-[calc(100vh-60px)] py-20 px-5 overflow-hidden">
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
        <div className="mb-8">
          <h1 className="text-[22px] font-bold mb-2">Buy Vouchers</h1>
          <p className="text-xs text-white-mid leading-[1.75] max-w-[600px]">
            Buy gift cards with fiat, convert them to Monero, and fund your CleanRoom balance.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 border border-error/30 bg-error/10 text-error text-xs clip-cut-tr">
            {error}
          </div>
        )}

        {/* ── Frog-foot tab bar with webbing ── */}
        <div className="mb-8">
          <div className="flex items-start justify-between relative">
            {steps.map((s, i) => {
              const isActive = step === s.key;
              const isDone = stepIdx > i;
              return (
                <button
                  key={s.key}
                  onClick={() => goToStep(s.key)}
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
                    style={{
                      clipPath:
                        "polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)",
                    }}
                  >
                    {isDone ? <Check size={14} weight="bold" /> : s.icon}
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

          {/* Webbing — connected bar with nodes */}
          <div className="relative mt-1 mx-2 h-[18px]">
            <svg
              viewBox="0 0 100 18"
              className="w-full h-full"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="web-fill" x1="0" y1="0" x2="1" y2="0">
                  <stop
                    offset="0%"
                    stopColor="#00ff41"
                    stopOpacity={stepIdx >= 0 ? 0.6 : 0.08}
                  />
                  <stop
                    offset="50%"
                    stopColor="#00ff41"
                    stopOpacity={stepIdx >= 1 ? 0.6 : 0.08}
                  />
                  <stop
                    offset="100%"
                    stopColor="#00ff41"
                    stopOpacity={stepIdx >= 2 ? 0.6 : 0.08}
                  />
                </linearGradient>
              </defs>

              <path
                d="M0,10 Q15,2 33,10 Q50,18 67,10 Q85,2 100,10"
                fill="none"
                stroke="url(#web-fill)"
                strokeWidth="1.5"
              />
              <path
                d="M0,14 Q15,6 33,14 Q50,22 67,14 Q85,6 100,14"
                fill="none"
                stroke="url(#web-fill)"
                strokeWidth="0.5"
                opacity={0.4}
              />

              {[0, 2, 4].map((i) => (
                <circle
                  key={i}
                  cx={i === 0 ? 0 : i === 2 ? 50 : 100}
                  cy={i === 0 ? 10 : i === 2 ? 18 : 10}
                  r="2"
                  fill={i <= stepIdx * 2 ? "#00ff41" : "#ffffff22"}
                />
              ))}

              {stepIdx === 0 && (
                <circle
                  cx="0"
                  cy="10"
                  r="4"
                  fill="none"
                  stroke="#00ff41"
                  strokeWidth="0.5"
                  opacity={0.5}
                >
                  <animate
                    attributeName="r"
                    values="4;6;4"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.5;0;0.5"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
              {stepIdx === 1 && (
                <circle
                  cx="50"
                  cy="18"
                  r="4"
                  fill="none"
                  stroke="#00ff41"
                  strokeWidth="0.5"
                  opacity={0.5}
                >
                  <animate
                    attributeName="r"
                    values="4;6;4"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.5;0;0.5"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
            </svg>

            <div className="absolute inset-0 flex justify-between items-center px-[3px]">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`w-[3px] h-[3px] rounded-full transition-colors duration-500 ${
                    i <= stepIdx ? "bg-green" : "bg-white-dim/10"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Tab Content ── */}

        {/* ── Step 1: Browse ── */}
        {step === "browse" && (
          <>
            {/* Payment method filter */}
            {allPaymentMethods.length > 0 && (
              <div className="mb-6 flex flex-wrap items-center gap-2">
                {[
                  { key: null, label: "All" },
                  ...allPaymentMethods.map((m) => ({ key: m, label: m })),
                ].map((f) => (
                  <button
                    key={f.label}
                    onClick={() => setFilterPayment(f.key)}
                    className={`text-[10px] tracking-[0.1em] uppercase px-3 py-1.5 border transition-all ${
                      filterPayment === f.key
                        ? "border-green/40 text-green bg-green-dim/20"
                        : "border-white-dim/20 text-white-dim hover:border-white-dim/40"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}

            {/* Listings */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Spinner size={20} className="text-green animate-spin" />
                <span className="ml-2 text-xs text-white-dim">
                  Loading listings...
                </span>
              </div>
            ) : (
              <InfiniteScroll
                items={filtered}
                pageSize={10}
                keyExtractor={(l) => l.id}
                gridCols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                hibernationPages={2}
                emptyState={
                  <div className="text-center py-16 border border-dashed border-white-dim/10 clip-card">
                    <ShoppingCart
                      size={32}
                      className="text-white-dim/20 mx-auto mb-3"
                    />
                    <p className="text-sm text-white-dim">
                      No listings available yet.
                    </p>
                    <p className="text-xs text-white-mid mt-1">
                      Check back soon for new voucher options.
                    </p>
                  </div>
                }
                renderItem={(listing) => (
                  <button
                    onClick={() => openDrawer(listing)}
                    className="w-full bg-surface border border-green/10 p-6 clip-card flex flex-col text-left relative hover:border-green/25 transition-colors cursor-pointer group"
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

                    <p className="text-[11px] text-white-mid leading-[1.7] mb-4 flex-1 line-clamp-3">
                      {listing.description}
                    </p>

                    <div className="mb-4">
                      <div className="text-[9px] tracking-[0.15em] uppercase text-white-dim mb-2">
                        Accepted
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

                    <div className="text-[10px] tracking-[0.1em] uppercase text-green/60 group-hover:text-green transition-colors flex items-center gap-1 mt-auto">
                      Select
                      <CaretRight size={12} />
                    </div>
                  </button>
                )}
              />
            )}
          </>
        )}

        {/* ── Step 2: Convert ── */}
        {step === "convert" && (
          <div className="w-full bg-surface border border-green/12 p-8 sm:p-10 clip-card">
            <div className="flex items-center gap-2 mb-1">
              <CurrencyCircleDollar size={16} className="text-green" />
              <span className="section-label mb-0">Convert to Monero</span>
            </div>

            {selectedListing ? (
              <>
                <p className="text-xs text-white-mid leading-[1.75] mt-2 mb-6">
                  You selected{" "}
                  <span className="text-green font-bold">
                    {selectedListing.title}
                  </span>
                  . Now sell that gift card code for XMR on a peer-to-peer
                  exchange.
                </p>

                <div className="space-y-4">
                  <ExchangeCard
                    name="AgorDesk"
                    url="https://agoradesk.com"
                    description="P2P crypto exchange with gift card trading. Create a sell offer, find a buyer, and trade your code for XMR. No KYC required for small trades."
                    guides={[
                      "Create an account (no KYC)",
                      "Post a sell offer for your gift card type",
                      "Wait for a buyer — trade code for XMR",
                      "Withdraw XMR to your wallet",
                    ]}
                  />

                  <ExchangeCard
                    name="LocalMonero"
                    url="https://localmonero.co"
                    description="Peer-to-peer Monero marketplace. Gift card trades are common. Check buyer reputation before trading."
                    guides={[
                      "Browse or create a sell offer",
                      "Select your gift card type as payment method",
                      "Complete the trade — code for XMR",
                      "Send XMR to your deposit address",
                    ]}
                  />
                </div>

                <div className="mt-8 flex items-start gap-3 p-4 border border-green/8 bg-green/[0.02] clip-cut-tr">
                  <div className="w-0.5 shrink-0 self-stretch bg-green" />
                  <div className="flex-1">
                    <div className="text-xs font-bold text-green mb-1">
                      Got your XMR?
                    </div>
                    <p className="text-[11px] text-white-mid leading-[1.7] mb-3">
                      Once you&apos;ve received the Monero from the exchange,
                      proceed to deposit it into your CleanRoom balance.
                    </p>
                    <button
                      onClick={handleMarkConverted}
                      className="clip-spell inline-flex items-center gap-1.5 bg-green-dim/30 border border-green/40 text-green text-xs font-bold tracking-[0.15em] uppercase px-5 py-2.5 transition-all hover:bg-green-dim/50 hover:border-green"
                    >
                      I&apos;ve received XMR
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <CurrencyCircleDollar
                  size={32}
                  className="text-white-dim/20 mx-auto mb-3"
                />
                <p className="text-sm text-white-dim mb-1">
                  No gift card selected
                </p>
                <p className="text-xs text-white-mid mb-5">
                  Go back to Browse and pick a gift card first.
                </p>
                <button
                  onClick={() => goToStep("browse")}
                  className="clip-spell inline-flex items-center gap-1.5 bg-green-dim/30 border border-green/40 text-green text-xs font-bold tracking-[0.15em] uppercase px-5 py-2.5 transition-all hover:bg-green-dim/50 hover:border-green"
                >
                  <CaretLeft size={14} />
                  Browse gift cards
                </button>
              </div>
            )}

            {/* Back */}
            <div className="mt-4">
              <button
                onClick={() => goToStep("browse")}
                className="text-[10px] tracking-[0.1em] uppercase text-white-dim hover:text-foreground transition-colors flex items-center gap-1"
              >
                <CaretLeft size={12} />
                Back to browse
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
              Send your Monero to this address. After one confirmation (~2
              minutes), your CleanRoom balance is credited.
            </p>

            {deposit ? (
              <>
                <div className="bg-void border border-green/14 p-5 mb-5 clip-cut-tr">
                  <div className="text-[9px] tracking-[0.22em] uppercase text-white-dim mb-2.5">
                    Deposit address
                  </div>
                  <div className="text-[11px] text-green tracking-[0.04em] break-all leading-[1.9]">
                    {deposit.integrated_address}
                  </div>
                  <div className="flex justify-end mt-3">
                    <button
                      onClick={() =>
                        handleCopy(deposit.integrated_address, "address")
                      }
                      className="clip-spell inline-flex items-center gap-1.5 border border-white-dim/30 text-white-mid text-[10px] font-bold tracking-[0.15em] uppercase px-3 py-1.5 transition-all hover:border-white-dim/60 hover:text-foreground"
                    >
                      <Copy size={12} />
                      {copied === "address" ? "Copied" : "Copy address"}
                    </button>
                  </div>
                </div>

                <div className="bg-void border border-green/7 p-4 mb-5 clip-cut-tr">
                  <div className="text-[9px] tracking-[0.22em] uppercase text-white-dim mb-1.5">
                    Payment ID (save this)
                  </div>
                  <div className="text-[11px] text-green tracking-[0.04em] break-all leading-[1.9]">
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
                <Wallet
                  size={32}
                  className="text-white-dim/20 mx-auto mb-3"
                />
                <p className="text-sm text-white-dim mb-1">
                  Generate a deposit address
                </p>
                <p className="text-xs text-white-mid mb-5">
                  You need a CleanRoom deposit address to receive your XMR.
                </p>
                <button
                  onClick={handleGenerateDeposit}
                  disabled={generatingDeposit}
                  className="clip-spell inline-flex items-center gap-1.5 bg-green-dim/30 border border-green/40 text-green text-xs font-bold tracking-[0.15em] uppercase px-6 py-3 transition-all hover:bg-green-dim/50 hover:border-green disabled:opacity-40"
                >
                  {generatingDeposit ? (
                    <>
                      <Spinner size={14} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      Generate deposit address
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Back */}
            <div className="mt-4">
              <button
                onClick={() => goToStep("convert")}
                className="text-[10px] tracking-[0.1em] uppercase text-white-dim hover:text-foreground transition-colors flex items-center gap-1"
              >
                <CaretLeft size={12} />
                Back to convert
              </button>
            </div>
          </div>
        )}

        {/* ── Redeem section (always visible, collapsible) ── */}
        <details className="mt-10 group">
          <summary className="text-xs text-white-dim/50 hover:text-white-dim/80 transition-colors cursor-pointer tracking-[0.1em] uppercase select-none flex items-center gap-2">
            <Ticket size={12} />
            Have a CleanRoom code?
            <span className="text-white-dim/20 group-open:hidden">▶</span>
            <span className="text-white-dim/20 hidden group-open:inline">▼</span>
          </summary>
          <div className="mt-4 w-full bg-surface border border-green/12 p-6 sm:p-8 clip-card">
            <p className="text-xs text-white-mid mb-4">
              Enter a voucher code you received from an admin or promotion.
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
                  <a
                    href="/balance"
                    className="text-green underline"
                  >
                    Balance page
                  </a>{" "}
                  to set up a payment ID first.
                </p>
              </div>
            )}
          </div>
        </details>
      </div>

      {/* ── Slide-in drawer ── */}
      <div
        className={`fixed inset-0 z-50 transition-all duration-300 ${
          drawerOpen ? "visible" : "invisible pointer-events-none"
        }`}
      >
        <div
          className="absolute inset-0 bg-void/60"
          onClick={closeDrawer}
        />
        <div
          className={`absolute top-0 right-0 h-full w-full max-w-[480px] bg-surface border-l border-green/12 transition-transform duration-300 ${
            drawerOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {drawerListing && (
            <div className="h-full flex flex-col overflow-y-auto">
              {/* Drawer header */}
              <div className="flex items-center justify-between p-6 border-b border-white-dim/8">
                <div className="text-xs font-bold text-foreground">
                  {drawerListing.platform_name}
                </div>
                <button
                  onClick={closeDrawer}
                  className="text-white-dim/40 hover:text-white-dim/80 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer body */}
              <div className="flex-1 p-6">
                <div className="text-[28px] font-bold text-green mb-1 [text-shadow:0_0_30px_rgba(0,255,65,0.2)]">
                  ${drawerListing.value_usd.toFixed(2)}
                </div>
                {drawerListing.value_xmr_display && (
                  <div className="text-xs text-white-dim mb-4">
                    ≈ {drawerListing.value_xmr_display}
                  </div>
                )}

                <p className="text-sm text-white-mid leading-[1.8] mb-6">
                  {drawerListing.description}
                </p>

                <div className="mb-6">
                  <div className="text-[9px] tracking-[0.15em] uppercase text-white-dim mb-2">
                    Accepted payments
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {drawerListing.accepted_payments.map((p) => (
                      <span
                        key={p}
                        className="text-[9px] tracking-[0.1em] uppercase border border-white-dim/15 text-white-dim px-2 py-0.5"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                {/* How this works */}
                <div className="bg-void border border-green/7 p-4 clip-cut-tr mb-6">
                  <div className="text-[9px] tracking-[0.22em] uppercase text-white-dim mb-2">
                    How this works
                  </div>
                  <ol className="text-[11px] text-white-mid leading-[1.9] space-y-1 list-decimal list-inside">
                    <li>Buy this gift card on the reseller&apos;s site</li>
                    <li>You&apos;ll receive a digital code via email</li>
                    <li>
                      Come back here and mark it as purchased
                    </li>
                    <li>
                      We&apos;ll guide you through converting the code to XMR
                    </li>
                    <li>Deposit the XMR into your CleanRoom balance</li>
                  </ol>
                </div>
              </div>

              {/* Drawer footer */}
              <div className="p-6 border-t border-white-dim/8 flex flex-col gap-2">
                <a
                  href={drawerListing.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="clip-spell w-full inline-flex items-center justify-center gap-1.5 bg-green-dim/20 border border-green/30 text-green text-xs font-bold tracking-[0.15em] uppercase px-4 py-3 transition-all hover:bg-green-dim/40 hover:border-green"
                >
                  <ArrowSquareOut size={14} />
                  Purchase on {drawerListing.platform_name}
                </a>
                <button
                  onClick={markPurchased}
                  className="clip-spell w-full inline-flex items-center justify-center gap-1.5 border border-green/40 text-green text-xs font-bold tracking-[0.15em] uppercase px-4 py-3 transition-all hover:bg-green-dim/30"
                >
                  <Check size={14} />
                  I&apos;ve purchased — got the code
                </button>
                <button
                  onClick={closeDrawer}
                  className="text-[10px] tracking-[0.1em] uppercase text-white-dim/40 hover:text-white-dim/70 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
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
          <div className="text-[11px] text-white-mid leading-[1.7] mt-1">
            {description}
          </div>
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
        <div className="text-[9px] tracking-[0.15em] uppercase text-white-dim mb-2">
          Steps
        </div>
        <ol className="text-[11px] text-white-mid leading-[1.9] space-y-1 list-decimal list-inside">
          {guides.map((g, i) => (
            <li key={i}>{g}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
