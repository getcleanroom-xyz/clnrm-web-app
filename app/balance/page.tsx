"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { requestDepositAddress, checkBalance, payWithBalance } from "@/lib/api/balance";
import type { BalanceDepositResponse, BalanceResponse, BalancePayResponse } from "@/lib/api/types";
import { storeToken } from "@/lib/token-storage";
import { redeemVoucher } from "@/lib/api/voucher";
import { Copy, ArrowRight, Check, Ticket } from "@phosphor-icons/react";
import { toast } from "@/lib/toast";

const BALANCE_PID_KEY = "clnrm_balance_payment_id";
const BALANCE_DEPOSIT_KEY = "clnrm_balance_deposit";
const BASE_FEE = 1.00;
const PER_MIN = 0.05;
const MIN_MIN = 10;
const MAX_MIN = 60;
const STEP_MIN = 5;
const POLL_INTERVAL = 3000;
const MAX_POLLS = 600;

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

export default function BalancePage() {
  const router = useRouter();

  const [view, setView] = useState<"idle" | "deposit" | "depositing" | "ready" | "paying" | "paid">("idle");
  const [paymentId, setPaymentId] = useState("");
  const [inputPid, setInputPid] = useState("");
  const [deposit, setDeposit] = useState<BalanceDepositResponse | null>(null);
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [payResult, setPayResult] = useState<BalancePayResponse | null>(null);
  const [minutes, setMinutes] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const pollCountRef = useRef(0);
  const [voucherCode, setVoucherCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [voucherRedeemResult, setVoucherRedeemResult] = useState<string | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);

  const seconds = minutes * 60;
  const usdTotal = BASE_FEE + minutes * PER_MIN;
  const depositCountdown = useCountdown(deposit?.expires_at ?? null);

  // Restore saved payment_id or deposit address on mount
  useEffect(() => {
    setTimeout(() => {
      const saved = localStorage.getItem(BALANCE_PID_KEY);
      if (saved) {
        setPaymentId(saved);
        setInputPid(saved);
        fetchBalance(saved);
        return;
      }
      const savedDeposit = localStorage.getItem(BALANCE_DEPOSIT_KEY);
      if (savedDeposit) {
        try {
          const d = JSON.parse(savedDeposit) as BalanceDepositResponse;
          if (new Date(d.expires_at).getTime() > Date.now()) {
            setDeposit(d);
            setView("deposit");
          } else {
            localStorage.removeItem(BALANCE_DEPOSIT_KEY);
          }
        } catch {
          localStorage.removeItem(BALANCE_DEPOSIT_KEY);
        }
      }
    }, 0);
  }, []);

  async function fetchBalance(pid: string) {
    try {
      const b = await checkBalance(pid);
      setBalance(b);
      setView("ready");
    } catch {
      setView("idle");
    }
  }

  const handleGenerateDeposit = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await requestDepositAddress();
      setDeposit(d);
      localStorage.setItem(BALANCE_DEPOSIT_KEY, JSON.stringify(d));
      setView("deposit");
      toast.success("Deposit address generated. Send any amount of XMR.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to generate deposit address";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCheckBalance = useCallback(async () => {
    const pid = inputPid.trim();
    if (!pid) return;
    setLoading(true);
    setError(null);
    try {
      const b = await checkBalance(pid);
      setPaymentId(pid);
      setBalance(b);
      localStorage.setItem(BALANCE_PID_KEY, pid);
      localStorage.removeItem(BALANCE_DEPOSIT_KEY);
      setView("ready");
      toast.success("Balance loaded.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to check balance";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [inputPid]);

  // Poll for deposit confirmation
  useEffect(() => {
    if (view !== "depositing" || !deposit) return;

    pollCountRef.current = 0;
    setTimeout(() => setPollCount(0), 0);

    const pid = deposit.payment_id;
    let active = true;

    async function poll() {
      if (!active) return;

      if (pollCountRef.current >= MAX_POLLS) {
        const msg = "Deposit check timed out. Your funds may still arrive — re-check with your payment ID.";
        setError(msg);
        toast.error(msg);
        return;
      }

      try {
        const b = await checkBalance(pid);
        if (!active) return;
        if (b.balance_xmr > 0) {
          setPaymentId(pid);
          setBalance(b);
          localStorage.setItem(BALANCE_PID_KEY, pid);
          localStorage.removeItem(BALANCE_DEPOSIT_KEY);
          setView("ready");
          toast.success("Deposit confirmed! Your balance has been credited.");
          return;
        }
      } catch {
        if (!active) return;
      }
      pollCountRef.current++;
      setPollCount(pollCountRef.current);
    }

    poll();
    const id = setInterval(poll, POLL_INTERVAL);
    return () => { active = false; clearInterval(id); };
  }, [view, deposit]);

  const handlePay = useCallback(async () => {
    if (!paymentId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await payWithBalance(paymentId, seconds);
      setPayResult(result);
      storeToken(result.token);
      setView("paid");
      toast.success("Payment successful. Your session token is ready.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Payment failed";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [paymentId, seconds]);

  const handleRedeem = useCallback(async () => {
    if (!voucherCode.trim() || !paymentId) return;
    setRedeeming(true);
    setVoucherRedeemResult(null);
    setVoucherError(null);
    try {
      const res = await redeemVoucher(voucherCode.trim(), paymentId);
      const msg = `Redeemed $${res.value_usd} — ${res.value_xmr_display} credited.`;
      setVoucherRedeemResult(msg);
      setVoucherCode("");
      toast.success(msg);
      if (paymentId) fetchBalance(paymentId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to redeem code";
      setVoucherError(message);
      toast.error(message);
    } finally {
      setRedeeming(false);
    }
  }, [voucherCode, paymentId]);

  const handleCopy = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {}
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-60px)] flex items-start justify-center py-20 px-5 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 50% 60% at 50% 50%, rgba(0,59,15,0.18) 0%, transparent 65%)",
        }}
      />
      <div className="absolute inset-0 pointer-events-none grid-bg-sm" />

      <div className="relative z-10 w-full max-w-[560px]">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[22px] font-bold">Balance</h1>
          <p className="text-xs text-white-mid leading-[1.75]">
            Deposit XMR once and spend from your balance on any session.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 border border-error/30 bg-error/10 text-error text-xs clip-cut-tr">
            {error}
          </div>
        )}

        {/* ── Deposit / Check ── */}
        {view === "idle" && (
          <div className="w-full bg-surface border border-green/12 p-8 sm:p-12 clip-card mb-6">
            <div className="section-label mb-4">Get started</div>

            <div className="mb-8">
              <div className="text-xs font-bold text-white-dim mb-3">Deposit XMR</div>
              <p className="text-[11px] text-white-mid leading-[1.7] mb-4">
                Generate a unique deposit address. Send any amount of XMR. After one confirmation, your balance is credited.
              </p>
              <button
                onClick={handleGenerateDeposit}
                disabled={loading}
                className="clip-spell w-full inline-flex items-center justify-center gap-1.5 bg-green-dim/30 border border-green/40 text-green text-xs font-bold tracking-[0.15em] uppercase px-5 py-3 transition-all hover:bg-green-dim/50 hover:border-green disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Generating..." : "Generate deposit address"}
              </button>
            </div>

            <div className="relative flex items-center gap-3 mb-8">
              <div className="flex-1 h-px bg-white-dim/10" />
              <span className="text-[9px] tracking-[0.2em] uppercase text-white-dim/30">or</span>
              <div className="flex-1 h-px bg-white-dim/10" />
            </div>

            <div>
              <div className="text-xs font-bold text-white-dim mb-3">Check existing balance</div>
              <div className="flex gap-2">
                <Input
                  placeholder="Paste your payment ID"
                  value={inputPid}
                  onChange={(e) => setInputPid(e.target.value)}
                  className="flex-1"
                />
                <button
                  onClick={handleCheckBalance}
                  disabled={loading || !inputPid.trim()}
                  className="clip-spell inline-flex items-center gap-1.5 border border-green/40 text-green text-xs font-bold tracking-[0.15em] uppercase px-4 py-2 transition-all hover:bg-green-dim/30 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  {loading ? "..." : "Check"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Awaiting Deposit ── */}
        {view === "deposit" && deposit && (
          <div className="w-full bg-surface border border-green/12 p-8 sm:p-12 clip-card mb-6">
            <div className="section-label mb-4">Deposit address</div>
            <h1 className="text-[22px] font-bold mb-2">Send XMR to this address</h1>
            <p className="text-xs text-white-mid leading-[1.75] mb-7">
              Send any amount of XMR to the address below. After one confirmation (~2 minutes), your balance will be credited automatically.
            </p>

            <div className="bg-void border border-green/14 p-5 mb-5 clip-cut-tr">
              <div className="text-[9px] tracking-[0.22em] uppercase text-white-dim mb-2.5">Deposit address</div>
              <div className="text-[11px] text-green tracking-[0.04em] break-all leading-[1.9]">
                {deposit.integrated_address}
              </div>
              <div className="flex justify-end mt-3">
                <button
                  onClick={() => handleCopy(deposit.integrated_address, "address")}
                  className="clip-spell inline-flex items-center gap-1.5 border border-white-dim/30 text-white-mid text-[10px] font-bold tracking-[0.15em] uppercase px-3 py-1.5 transition-all hover:border-white-dim/60 hover:text-foreground"
                >
                  <Copy size={12} />
                  {copied === "address" ? "Copied" : "Copy address"}
                </button>
              </div>
            </div>

            <div className="bg-void border border-green/7 p-4 mb-5 clip-cut-tr">
              <div className="text-[9px] tracking-[0.22em] uppercase text-white-dim mb-1.5">Your payment ID (save this)</div>
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

            <div className="flex items-center gap-3 p-3.5 border border-green/7 bg-green/[0.025] clip-cut-tr mb-4">
              <div className="dot-pulse shrink-0" />
              <span className="text-xs text-white-mid flex-1">Waiting for deposit &mdash; check back after sending</span>
              <span className="text-sm font-bold text-green">{depositCountdown}</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  localStorage.removeItem(BALANCE_DEPOSIT_KEY);
                  setView("idle");
                }}
                className="clip-spell flex-1 inline-flex items-center justify-center gap-1.5 border border-white-dim/30 text-white-mid text-xs font-bold tracking-[0.15em] uppercase px-4 py-2.5 transition-all hover:border-white-dim/60 hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setView("depositing");
                  setError(null);
                }}
                className="clip-spell flex-1 inline-flex items-center justify-center gap-1.5 bg-green-dim/30 border border-green/40 text-green text-xs font-bold tracking-[0.15em] uppercase px-4 py-2.5 transition-all hover:bg-green-dim/50 hover:border-green"
              >
                Sent XMR &mdash; check now
              </button>
            </div>
          </div>
        )}

        {/* ── Depositing (polling) ── */}
        {view === "depositing" && deposit && (
          <div className="w-full bg-surface border border-green/12 p-8 sm:p-12 clip-card mb-6">
            <div className="flex flex-col items-center text-center py-6">
              <div className="flex gap-1.5 items-center mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-green" style={{ animation: "dot-bounce 1.2s ease-in-out infinite both", animationDelay: "0s" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-green" style={{ animation: "dot-bounce 1.2s ease-in-out infinite both", animationDelay: "0.2s" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-green" style={{ animation: "dot-bounce 1.2s ease-in-out infinite both", animationDelay: "0.4s" }} />
                <style>{`@keyframes dot-bounce{0%,60%,100%{opacity:.25;transform:translateY(0)}30%{opacity:1;transform:translateY(-3px)}}`}</style>
              </div>
              <div className="text-sm font-bold text-green mb-2">Checking for incoming funds</div>
              <div className="text-xs text-white-mid">
                Polling for confirmation (attempt {pollCount}/{MAX_POLLS})
              </div>
              <div className="mt-6">
                <button
                  onClick={() => setView("deposit")}
                  className="clip-spell inline-flex items-center gap-1.5 border border-white-dim/30 text-white-mid text-xs font-bold tracking-[0.15em] uppercase px-5 py-2.5 transition-all hover:border-white-dim/60 hover:text-foreground"
                >
                  Back to deposit details
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Balance Dashboard ── */}
        {view === "ready" && balance && (
          <>
            {/* Balance Card */}
            <div className="w-full bg-surface border border-green/12 p-8 sm:p-12 clip-card mb-6">
              <div className="section-label mb-4">Current balance</div>

              <div className="text-[44px] font-bold text-green leading-none [text-shadow:0_0_40px_rgba(0,255,65,0.25)] mb-2">
                {balance.balance_xmr_display}
              </div>
              <div className="text-xs text-white-mid leading-[1.7] mb-6">
                {balance.xmr_usd_price ? `≈ $${(balance.balance_xmr * balance.xmr_usd_price).toFixed(2)} USD` : "USD price unavailable"}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-void border border-green/7 p-3 clip-cut-tr">
                  <div className="text-[9px] tracking-[0.15em] uppercase text-white-dim mb-1">Deposited</div>
                  <div className="text-sm font-bold text-foreground">{balance.total_deposited_xmr.toFixed(6)} XMR</div>
                </div>
                <div className="bg-void border border-green/7 p-3 clip-cut-tr">
                  <div className="text-[9px] tracking-[0.15em] uppercase text-white-dim mb-1">Spent</div>
                  <div className="text-sm font-bold text-foreground">{balance.total_spent_xmr.toFixed(6)} XMR</div>
                </div>
              </div>

              <div className="bg-void border border-green/7 p-3 clip-cut-tr">
                <div className="text-[9px] tracking-[0.15em] uppercase text-white-dim mb-1">Payment ID</div>
                <div className="text-[11px] text-green tracking-[0.04em] break-all leading-[1.9]">
                  {paymentId}
                </div>
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => handleCopy(paymentId, "pid")}
                    className="clip-spell inline-flex items-center gap-1.5 border border-white-dim/30 text-white-mid text-[10px] font-bold tracking-[0.15em] uppercase px-3 py-1.5 transition-all hover:border-white-dim/60 hover:text-foreground"
                  >
                    <Copy size={12} />
                    {copied === "pid" ? "Copied" : "Copy ID"}
                  </button>
                </div>
              </div>

              {balance.can_afford_30min && (
                <div className="mt-4 flex items-start gap-3 p-3 border border-green/8 bg-green/[0.02] clip-cut-tr">
                  <div className="w-0.5 shrink-0 self-stretch bg-green" />
                  <div>
                    <div className="text-xs font-bold text-green mb-1">Sufficient balance</div>
                    <div className="text-[11px] text-white-mid leading-[1.7]">
                      You have enough for a 30-minute session.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pay for Session */}
            <div className="w-full bg-surface border border-green/12 p-8 sm:p-12 clip-card">
              <div className="section-label mb-4">Spend balance</div>
              <h1 className="text-[22px] font-bold mb-2">Start a new session</h1>
              <p className="text-xs text-white-mid leading-[1.75] mb-6">
                Choose duration and pay with your balance. A session JWT will be minted and you can join the queue.
              </p>

              <div className="mb-8">
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <div className="text-[44px] font-bold text-green leading-none [text-shadow:0_0_40px_rgba(0,255,65,0.25)]">
                      {minutes} <span className="text-base font-normal text-white-mid">min</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[22px] font-bold text-foreground">-- XMR</div>
                    <div className="text-xs text-white-dim mt-0.5">≈ ${usdTotal.toFixed(2)}</div>
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
                  <span className="text-white-dim">Cost</span>
                  <span className="text-foreground font-bold">${usdTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 text-xs">
                  <span className="text-white-dim">Balance available</span>
                  <span className={`font-bold ${balance.balance_xmr > 0 ? "text-green" : "text-white-dim"}`}>
                    {balance.balance_xmr_display}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => router.push("/")}
                  className="clip-spell inline-flex items-center gap-1.5 border border-white-dim/30 text-white-mid text-xs font-bold tracking-[0.15em] uppercase px-5 py-2.5 transition-all hover:border-white-dim/60 hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePay}
                  disabled={loading || balance.balance_xmr <= 0}
                  className="clip-spell inline-flex items-center gap-1.5 bg-green-dim/30 border border-green/40 text-green text-xs font-bold tracking-[0.15em] uppercase px-5 py-2.5 transition-all hover:bg-green-dim/50 hover:border-green disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? "Processing..." : "Pay with balance"}
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Redeem voucher — always visible */}
        <div className="w-full bg-surface border border-green/12 p-8 sm:p-12 clip-card mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Ticket size={14} className="text-green" />
            <span className="section-label mb-0">Redeem voucher</span>
          </div>
          {!paymentId ? (
            <div className="p-3 border border-green/8 bg-green/[0.02] clip-cut-tr">
              <p className="text-[11px] text-white-mid">
                {view === "idle"
                  ? "Generate a deposit address or check an existing balance first to set up a payment ID."
                  : "Go to the Balance dashboard to set up a payment ID first."}
              </p>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter voucher code"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  className="flex-1 font-mono tracking-wider"
                />
                <button
                  onClick={handleRedeem}
                  disabled={redeeming || !voucherCode.trim()}
                  className="clip-spell inline-flex items-center gap-1.5 bg-green-dim/30 border border-green/40 text-green text-xs font-bold tracking-[0.15em] uppercase px-4 py-2 transition-all hover:bg-green-dim/50 hover:border-green disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  {redeeming ? "..." : "Redeem"}
                </button>
              </div>
              {voucherRedeemResult && (
                <div className="mt-3 p-3 border border-green/30 bg-green/10 text-green text-xs clip-cut-tr">
                  {voucherRedeemResult}
                </div>
              )}
              {voucherError && (
                <div className="mt-3 p-3 border border-error/30 bg-error/10 text-error text-xs clip-cut-tr">
                  {voucherError}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Paid ── */}
        {view === "paid" && payResult && (
          <div className="w-full bg-surface border border-green/12 p-8 sm:p-12 clip-card text-center">
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
            <h1 className="text-[22px] font-bold mb-2">Session token ready</h1>
            <p className="text-xs text-white-mid leading-[1.75] max-w-[380px] mx-auto mb-3">
              Charged {payResult.charge_xmr.toFixed(6)} XMR for {payResult.duration_label}. Remaining balance: {payResult.remaining_balance_xmr.toFixed(6)} XMR.
            </p>

            <div
              className="bg-void border border-green/16 p-6 relative text-[11px] text-green italic break-all tracking-[0.04em] leading-[1.9] mb-5 clip-card"
            >
              <span className="absolute top-0 left-0 text-[9px] tracking-[0.22em] not-italic text-void bg-green px-3 py-0.5 clip-[polygon(0_0,100%_0,calc(100%-8px)_100%,0_100%)]">
                TOKEN
              </span>
              {payResult.token}
            </div>

            <div className="flex items-start gap-3 p-3 border border-error/20 bg-error/10 clip-cut-tr mb-6 text-left">
              <div className="w-0.5 shrink-0 self-stretch bg-error" />
              <div>
                <div className="text-xs font-bold text-error mb-1">Save this before closing</div>
                <div className="text-[11px] text-white-mid leading-[1.7]">
                  Screenshot it. Copy it to a password manager. Write it down. We do not store it. If you lose it, the session credit is gone.
                </div>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap justify-center">
              <button
                onClick={() => handleCopy(payResult.token, "token")}
                className="clip-spell inline-flex items-center gap-1.5 border border-green/40 text-green text-xs font-bold tracking-[0.15em] uppercase px-6 py-3 transition-all hover:bg-green-dim/30"
              >
                <Copy size={14} />
                {copied === "token" ? "Copied" : "Copy token"}
              </button>
              <button
                onClick={() => router.push(`/queue?token=${encodeURIComponent(payResult.token)}`)}
                className="clip-spell inline-flex items-center gap-1.5 bg-green-dim/30 border border-green/40 text-green text-xs font-bold tracking-[0.15em] uppercase px-6 py-3 transition-all hover:bg-green-dim/50 hover:border-green"
              >
                Join queue now
                <ArrowRight size={14} />
              </button>
            </div>
            <div className="mt-4 flex gap-3 justify-center">
              <button
                onClick={() => {
                  setView("ready");
                  setPayResult(null);
                  fetchBalance(paymentId);
                }}
                className="text-[10px] tracking-[0.1em] uppercase text-white-dim hover:text-foreground transition-colors"
              >
                Back to balance
              </button>
              <button
                onClick={() => router.push("/")}
                className="text-[10px] tracking-[0.1em] uppercase text-white-dim hover:text-foreground transition-colors"
              >
                Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
