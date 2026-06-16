import { get, post } from "./client";
import type { BalanceDepositResponse, BalanceResponse, BalancePayResponse } from "./types";

export function requestDepositAddress(signal?: AbortSignal) {
  return post<BalanceDepositResponse>("/api/balance/deposit", {}, signal);
}

export function checkBalance(paymentId: string, signal?: AbortSignal) {
  return get<BalanceResponse>(`/api/balance/${encodeURIComponent(paymentId)}`, signal);
}

export function payWithBalance(paymentId: string, balanceToken: string, duration_seconds: number, signal?: AbortSignal) {
  return post<BalancePayResponse>("/api/balance/pay", { payment_id: paymentId, balance_token: balanceToken, duration_seconds }, signal);
}
