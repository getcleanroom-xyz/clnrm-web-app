import { get, post } from "./client";
import type { QuoteRequest, QuoteResponse, TokenCheckResponse } from "./types";

export function getQuote(duration_seconds: number, signal?: AbortSignal) {
  return post<QuoteResponse>("/api/payment/quote", { duration_seconds } satisfies QuoteRequest, signal);
}

export function checkPayment(paymentId: string, signal?: AbortSignal) {
  return get<TokenCheckResponse>(`/api/payment/token/${paymentId}`, signal);
}
