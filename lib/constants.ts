// ── Pricing ──
// Centralized so changes only need to happen in one place.

export const BASE_FEE = 0.50;
export const PER_MIN = 0.29;
export const MIN_MIN = 10;
export const MAX_MIN = 60;
export const STEP_MIN = 5;

// ── Polling ──

export const POLL_INTERVAL = 3000;
export const MAX_POLLS = 600;

// ── Storage keys ──

export const PENDING_PAYMENT_KEY = "clnrm_pending_payment";
export const BALANCE_PID_KEY = "clnrm_balance_payment_id";
export const BALANCE_TOKEN_KEY = "clnrm_balance_token";
export const BALANCE_DEPOSIT_KEY = "clnrm_balance_deposit";

// ── Helpers ──

export function formatPricing(minutes: number): string {
  const total = BASE_FEE + minutes * PER_MIN;
  return `$${total.toFixed(2)} for ${minutes} minutes ($${BASE_FEE.toFixed(2)} + $${PER_MIN.toFixed(2)}/min)`;
}

export function usdPrice(minutes: number): number {
  return BASE_FEE + minutes * PER_MIN;
}
