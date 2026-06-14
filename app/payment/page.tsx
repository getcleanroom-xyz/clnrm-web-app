"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { getQuote, checkPayment } from "@/lib/api/payment";
import type { QuoteResponse } from "@/lib/api/types";
import { Copy, ArrowRight, ArrowLeft, Check } from "@phosphor-icons/react";
import { storeToken } from "@/lib/token-storage";

const BASE_FEE = 1.00;
const PER_MIN = 0.05;
const MIN_MIN = 10;
const MAX_MIN = 60;
const STEP_MIN = 5;
const POLL_INTERVAL = 3000;
const MAX_POLLS = 600;
const PENDING_PAYMENT_KEY = "clnrm_pending_payment";

function useCountdown(expiresAt: string | null) {
  const [display, setDisplay] = useState("--:--");

  useEffect(() => {
    if (!expiresAt) return;
    const deadline = new Date(expiresAt).getTime();

    function tick() {
      const diff = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
      const m = Math.floor(diff / 60);
      const s = diff % 60;
      setDisplay(`${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
      return diff;
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return display;
}

function StepPips({ current }: { current: number }) {
  const labels = ["Duration", "Send XMR", "Token"];
  return (
    <div className="flex gap-0 mb-10">
      {labels.map((label, i) => (
        <div key={label} className={`flex items-center gap-2 ${i < labels.length - 1 ? "flex-1" : "flex-0"}`}>
          <div
            className={`w-6 h-6 flex items-center justify-center text-[10px] font-bold shrink-0 transition-all duration-200 clip-[polygon(4px_0,100%_0,100%_calc(100%-4px),calc(100%-4px)_100%,0_100%,0_4px)] ${
              i + 1 === current
                ? "bg-green-dim text-green border border-green/40"
                : i + 1 < current
                  ? "bg-green/10 text-green border border-green/20"
                  : "border border-green/20 text-white-dim"
            }`}
          >
            {i + 1 < current ? <Check size={12} weight="bold" /> : i + 1}
          </div>
          <span
            className={`text-[10px] tracking-[0.1em] uppercase ${
              i + 1 === current ? "text-green" : "text-white-dim"
            } hidden sm:inline`}
          >
            {label}
          </span>
          {i < labels.length - 1 && (
            <div
              className={`flex-1 h-px mx-2 ${
                i + 1 < current ? "bg-green/20" : "bg-white-dim/10"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function PaymentPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [minutes, setMinutes] = useState(30);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const quoteRef = useRef<QuoteResponse | null>(null);

  const seconds = minutes * 60;
  const usdTotal = BASE_FEE + minutes * PER_MIN;
  const durFee = minutes * PER_MIN;
  const countdown = useCountdown(quote?.expires_at ?? null);

  const handleGenerateAddress = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = await getQuote(seconds);
      setQuote(q);
      quoteRef.current = q;
      localStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify(q));
      setStep(2);
      setPolling(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to get quote");
    } finally {
      setLoading(false);
    }
  }, [seconds]);

  const handleCopy = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {}
  }, []);

  // Restore pending payment on mount
  useEffect(() => {
    setTimeout(() => {
      try {
        const stored = localStorage.getItem(PENDING_PAYMENT_KEY);
        if (!stored) return;
        const restored = JSON.parse(stored) as QuoteResponse;
        const expiresAt = new Date(restored.expires_at).getTime();
        if (expiresAt > Date.now()) {
          setQuote(restored);
          quoteRef.current = restored;
          setPolling(true);
          setStep(2);
        } else {
          localStorage.removeItem(PENDING_PAYMENT_KEY);
        }
      } catch {}
    }, 0);
  }, []);

  // Poll for payment confirmation with max retries and backoff
  useEffect(() => {
    if (!polling || !quoteRef.current) return;

    const pid = quoteRef.current.payment_id;
    let active = true;
    let pollCount = 0;

    async function poll() {
      if (pollCount >= MAX_POLLS) {
        setPolling(false);
        setError("Payment check timed out. Your payment may still confirm — check your wallet.");
        return;
      }

      try {
        const res = await checkPayment(pid);
        if (!active) return;
        if (res.status === "confirmed" && res.token) {
          setToken(res.token);
          storeToken(res.token);
          setPolling(false);
          localStorage.removeItem(PENDING_PAYMENT_KEY);
          setStep(3);
        } else if (res.status === "expired") {
          setPolling(false);
          localStorage.removeItem(PENDING_PAYMENT_KEY);
          setError("Quote expired. Please request a new one.");
        } else {
          pollCount++;
        }
      } catch {
        pollCount++;
      }
    }

    poll();
    const id = setInterval(poll, POLL_INTERVAL);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [polling]);

  return (
    <div className="relative min-h-[calc(100vh-60px)] flex items-center justify-center py-20 px-5 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 50% 60% at 50% 50%, rgba(0,59,15,0.18) 0%, transparent 65%)",
        }}
      />
      <div className="absolute inset-0 pointer-events-none grid-bg-sm" />

      <div
        className="relative z-10 w-full max-w-[560px] bg-surface border border-green/12 p-8 sm:p-12"
        style={{ clipPath: "polygon(0 0, calc(100% - 28px) 0, 100% 28px, 100% calc(100% - 14px), calc(100% - 14px) 100%, 14px 100%, 0 calc(100% - 28px))" }}
      >
        <div
          className="absolute top-0 right-0 w-7 h-7 bg-green/14 pointer-events-none"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%)" }}
        />

        <StepPips current={step} />

        {error && (
          <div className="mb-6 p-3 border border-error/30 bg-error/10 text-error text-xs clip-cut-tr">
            {error}
          </div>
        )}

        {step === 1 && (
          <>
            <div className="section-label mb-4">New session</div>
            <h1 className="text-[22px] font-bold mb-2">Choose your duration</h1>
            <p className="text-xs text-white-mid leading-[1.75] mb-8">
              $1.00 base + $0.05 per minute. XMR amount locked for 15 minutes at current rate.
            </p>

            <div className="mb-8">
              <div className="flex justify-between items-end mb-3">
                <div>
                  <div className="text-[44px] font-bold text-green leading-none [text-shadow:0_0_40px_rgba(0,255,65,0.25)]">
                    {minutes} <span className="text-base font-normal text-white-mid">min</span>
                  </div>
                </div>
                <div className="text-right">
                  {quote ? (
                    <>
                      <div className="text-[22px] font-bold text-foreground">{quote.xmr_amount_display}</div>
                      <div className="text-xs text-white-dim mt-0.5">≈ ${usdTotal.toFixed(2)}</div>
                    </>
                  ) : (
                    <>
                      <div className="text-[22px] font-bold text-white-dim">-- XMR</div>
                      <div className="text-xs text-white-dim mt-0.5">≈ ${usdTotal.toFixed(2)}</div>
                    </>
                  )}
                </div>
              </div>

              <Slider
                value={[minutes]}
                onValueChange={([v]) => setMinutes(v)}
                min={MIN_MIN}
                max={MAX_MIN}
                step={STEP_MIN}
              />

              <div className="flex justify-between mt-2">
                <span className="text-[10px] text-white-dim/20">10 min</span>
                <span className="text-[10px] text-white-dim/20">20</span>
                <span className="text-[10px] text-white-dim/20">30</span>
                <span className="text-[10px] text-white-dim/20">40</span>
                <span className="text-[10px] text-white-dim/20">50</span>
                <span className="text-[10px] text-white-dim/20">60 min</span>
              </div>
            </div>

            <div className="bg-void border border-green/8 p-5 mb-6 clip-cut-tr">
              <div className="flex justify-between items-center py-1.5 text-xs border-b border-white-dim/4">
                <span className="text-white-dim">Base fee</span>
                <span className="text-foreground font-bold">$1.00</span>
              </div>
              <div className="flex justify-between items-center py-1.5 text-xs border-b border-white-dim/4">
                <span className="text-white-dim">Duration fee ({minutes} min × $0.05)</span>
                <span className="text-foreground font-bold">${durFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 text-xs border-b border-white-dim/4">
                <span className="text-white-dim">XMR rate</span>
                <span className="text-foreground font-bold">
                  {quote ? `$${(quote.usd_amount / quote.xmr_amount).toFixed(2)} / XMR` : "-- / XMR"}
                </span>
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-green/12">
                <span className="text-[11px] tracking-[0.15em] uppercase text-white-dim">Total</span>
                <span className="text-2xl font-bold text-green [text-shadow:0_0_20px_rgba(0,255,65,0.3)]">
                  ${usdTotal.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border border-white-dim/10 bg-white-dim/[0.025] clip-cut-tr mb-6">
              <div className="w-0.5 shrink-0 self-stretch bg-white-dim/20" />
              <div>
                <div className="text-xs font-bold text-white-dim mb-1">No refunds</div>
                <div className="text-[11px] text-white-mid leading-[1.7]">
                  The compute begins the moment your container starts. No refunds by design &mdash; the payment model and the privacy model require it.
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => router.push("/")}
                className="clip-spell inline-flex items-center gap-1.5 border border-white-dim/30 text-white-mid text-xs font-bold tracking-[0.15em] uppercase px-5 py-2.5 transition-all hover:border-white-dim/60 hover:text-foreground"
              >
                <ArrowLeft size={14} />
                Cancel
              </button>
              <button
                onClick={handleGenerateAddress}
                disabled={loading}
                className="clip-spell inline-flex items-center gap-1.5 bg-green-dim/30 border border-green/40 text-green text-xs font-bold tracking-[0.15em] uppercase px-5 py-2.5 transition-all hover:bg-green-dim/50 hover:border-green disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Generating..." : "Generate payment address"}
                <ArrowRight size={14} />
              </button>
            </div>
          </>
        )}

        {step === 2 && quote && (
          <>
            <div className="section-label mb-4">Send payment</div>
            <h1 className="text-[22px] font-bold mb-2">Transfer the exact amount</h1>
            <p className="text-xs text-white-mid leading-[1.75] mb-7">
              This stealth address is unique to your request. It cannot be linked to any other session or to your wallet&apos;s public identity.
            </p>

            <div className="bg-void border border-green/14 p-5 mb-5 clip-cut-tr">
              <div className="text-[9px] tracking-[0.22em] uppercase text-white-dim mb-2.5">Stealth address</div>
              <div className="text-[11px] text-green tracking-[0.04em] break-all leading-[1.9]">
                {quote.integrated_address}
              </div>
              <div className="flex justify-end mt-3">
              <button
                onClick={() => handleCopy(quote.integrated_address, "address")}
                className="clip-spell inline-flex items-center gap-1.5 border border-white-dim/30 text-white-mid text-[10px] font-bold tracking-[0.15em] uppercase px-3 py-1.5 transition-all hover:border-white-dim/60 hover:text-foreground"
                aria-label="Copy stealth address to clipboard"
              >
                <Copy size={12} />
                {copied === "address" ? "Copied" : "Copy address"}
              </button>
              </div>
            </div>

            <div className="flex justify-between items-center py-4 border-y border-green/7 mb-5">
              <div>
                <div className="text-[10px] tracking-[0.15em] uppercase text-white-dim mb-1">Send exactly</div>
                <div className="text-[28px] font-bold text-green [text-shadow:0_0_24px_rgba(0,255,65,0.3)]">
                  {quote.xmr_amount_display}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] tracking-[0.15em] uppercase text-white-dim mb-1">For session</div>
                <div className="text-sm text-foreground">{quote.duration_label}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 border border-green/7 bg-green/[0.025] clip-cut-tr mb-4">
              <div className="dot-pulse shrink-0" />
              <span className="text-xs text-white-mid flex-1">Monitoring chain &mdash; waiting for your transaction</span>
              <span className="text-sm font-bold text-green">{countdown}</span>
            </div>

            <div className="flex items-start gap-3 p-3 border border-green/10 bg-green/[0.02] clip-cut-tr mb-6">
              <div className="w-0.5 shrink-0 self-stretch bg-green" />
              <div>
                <div className="text-xs font-bold text-green mb-1">Quote locked for 15 minutes</div>
                <div className="text-[11px] text-white-mid leading-[1.7]">
                  After the timer expires, the stealth address is voided. Request a new quote if you miss the window &mdash; the XMR price may have changed.
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => { setStep(1); setPolling(false); }}
                className="clip-spell inline-flex items-center gap-1.5 border border-white-dim/30 text-white-mid text-xs font-bold tracking-[0.15em] uppercase px-5 py-2.5 transition-all hover:border-white-dim/60 hover:text-foreground"
              >
                <ArrowLeft size={14} />
                Back
              </button>
              <Badge variant="live" className="text-[10px]">
                <span className="dot-pulse mr-1.5" />
                Waiting for payment
              </Badge>
            </div>
          </>
        )}

        {step === 3 && token && (
          <div className="text-center">
            <div className="w-[72px] h-[72px] mx-auto mb-7 relative flex items-center justify-center">
              <div
                className="absolute inset-0 border border-green animate-[ring-glow_3s_ease-in-out_infinite]"
                style={{ clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))" }}
              />
              <div
                className="absolute inset-[8px] bg-green/7"
                style={{ clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))" }}
              />
              <Check size={24} weight="bold" className="text-green relative z-10 [text-shadow:0_0_24px_rgba(0,255,65,0.5)]" />
            </div>

            <div className="section-label justify-center mb-3">Payment confirmed</div>
            <h1 className="text-[22px] font-bold mb-2">Your token is ready</h1>
            <p className="text-xs text-white-mid leading-[1.75] max-w-[380px] mx-auto mb-5">
              Store this token. It is the only artifact of your purchase. Valid for 24 hours. Single use. No recovery.
            </p>

            <div
              className="bg-void border border-green/16 p-6 relative text-[11px] text-green italic break-all tracking-[0.04em] leading-[1.9] mb-5 clip-card"
            >
              <span className="absolute top-0 left-0 text-[9px] tracking-[0.22em] not-italic text-void bg-green px-3 py-0.5 clip-[polygon(0_0,100%_0,calc(100%-8px)_100%,0_100%)]">
                TOKEN
              </span>
              {token}
            </div>

            <div className="flex items-start gap-3 p-3 border border-error/20 bg-error/10 clip-cut-tr mb-6 text-left">
              <div className="w-0.5 shrink-0 self-stretch bg-error" />
              <div>
                <div className="text-xs font-bold text-error mb-1">Save this before closing</div>
                <div className="text-[11px] text-white-mid leading-[1.7]">
                  Screenshot it. Copy it to a password manager. Write it down. We do not store it. There is no account to look it up from. If you lose it, the session credit is gone.
                </div>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap justify-center">
              <button
                onClick={() => handleCopy(token, "token")}
                className="clip-spell inline-flex items-center gap-1.5 border border-green/40 text-green text-xs font-bold tracking-[0.15em] uppercase px-6 py-3 transition-all hover:bg-green-dim/30"
                aria-label="Copy session token to clipboard"
              >
                <Copy size={14} />
                {copied === "token" ? "Copied" : "Copy token"}
              </button>
              <button
                onClick={() => router.push(`/queue?token=${encodeURIComponent(token)}`)}
                className="clip-spell inline-flex items-center gap-1.5 bg-green-dim/30 border border-green/40 text-green text-xs font-bold tracking-[0.15em] uppercase px-6 py-3 transition-all hover:bg-green-dim/50 hover:border-green"
                aria-label="Join queue with this token"
              >
                Join queue now
                <ArrowRight size={14} />
              </button>
            </div>
            <div className="mt-3">
              <button
                onClick={() => router.push("/")}
                className="text-[10px] tracking-[0.1em] uppercase text-white-dim hover:text-foreground transition-colors"
              >
                Join queue later &mdash; token valid for 24 hours
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
