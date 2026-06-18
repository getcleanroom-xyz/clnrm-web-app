"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { requestDepositAddress } from "@/lib/api/balance";
import type { VoucherListingPublic, BalanceDepositResponse } from "@/lib/api/types";

export const BALANCE_PID_KEY = "clnrm_balance_payment_id";
export const BALANCE_DEPOSIT_KEY = "clnrm_balance_deposit";
export const WIZARD_LISTING_KEY = "clnrm_wizard_listing";

const VALID_STEPS = ["browse", "convert", "deposit"] as const;
export type Step = (typeof VALID_STEPS)[number];

export function useStep() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const raw = searchParams.get("step");

  const [step, setStepState] = useState<Step>(
    VALID_STEPS.includes(raw as Step) ? (raw as Step) : "browse",
  );

  const setStep = useCallback(
    (s: Step) => {
      setStepState(s);
      const url = new URL(window.location.href);
      url.searchParams.set("step", s);
      router.replace(url.toString(), { scroll: false });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [router],
  );

  useEffect(() => {
    const onPopState = () => {
      const r = new URLSearchParams(window.location.search).get("step");
      setStepState(VALID_STEPS.includes(r as Step) ? (r as Step) : "browse");
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return { step, setStep, stepIdx: VALID_STEPS.indexOf(step) };
}

export function useDeposit() {
  const [deposit, setDeposit] = useState<BalanceDepositResponse | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = localStorage.getItem(BALANCE_DEPOSIT_KEY);
      if (!saved) return null;
      const d = JSON.parse(saved) as BalanceDepositResponse;
      if (new Date(d.expires_at).getTime() > Date.now()) return d;
      localStorage.removeItem(BALANCE_DEPOSIT_KEY);
      return null;
    } catch {
      localStorage.removeItem(BALANCE_DEPOSIT_KEY);
      return null;
    }
  });
  const [generatingDeposit, setGeneratingDeposit] = useState(false);
  const paymentId = deposit?.payment_id ?? null;

  const generateDeposit = useCallback(async () => {
    setGeneratingDeposit(true);
    try {
      const d = await requestDepositAddress();
      setDeposit(d);
      localStorage.setItem(BALANCE_DEPOSIT_KEY, JSON.stringify(d));
      localStorage.setItem(BALANCE_PID_KEY, d.payment_id);
    } catch (err: unknown) {
      throw err;
    } finally {
      setGeneratingDeposit(false);
    }
  }, []);

  return { deposit, generatingDeposit, paymentId, generateDeposit };
}

export function usePopover() {
  const [popoverListing, setPopoverListing] = useState<VoucherListingPublic | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-details-trigger]")) return;
      if (popoverRef.current && !popoverRef.current.contains(target)) {
        setPopoverListing(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPopoverListing(null);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!popoverListing) return;
    const handler = () => setPopoverListing(null);
    window.addEventListener("scroll", handler, { once: true });
    return () => window.removeEventListener("scroll", handler);
  }, [popoverListing]);

  const togglePopover = useCallback((listing: VoucherListingPublic) => {
    setPopoverListing((prev) => (prev?.id === listing.id ? null : listing));
  }, []);

  return { popoverListing, popoverRef, setPopoverListing, togglePopover };
}
