import { get, post } from "./client";
import type { BalanceDepositResponse, BalanceResponse, BalancePayResponse, RenewTokenResponse } from "./types";

export function requestDepositAddress(signal?: AbortSignal) {
  return post<BalanceDepositResponse>("/api/balance/deposit", {}, signal);
}

export function checkBalance(paymentId: string, signal?: AbortSignal) {
  return get<BalanceResponse>(`/api/balance/${encodeURIComponent(paymentId)}`, signal);
}

export function renewBalanceToken(paymentId: string, signal?: AbortSignal) {
  return post<RenewTokenResponse>("/api/balance/renew-token", { payment_id: paymentId }, signal);
}

export function payWithBalance(paymentId: string, duration_seconds: number, balanceToken?: string, signal?: AbortSignal) {
  return post<BalancePayResponse>("/api/balance/pay", {
    payment_id: paymentId,
    duration_seconds,
    balance_token: balanceToken ?? "",
  }, signal);
}
