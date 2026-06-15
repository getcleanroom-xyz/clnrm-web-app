import { get, post } from "./client";
import type { VoucherListingsResponse, RedeemVoucherResponse } from "./types";

export function getVoucherListings(signal?: AbortSignal) {
  return get<VoucherListingsResponse>("/api/vouchers/listings", signal);
}

export function redeemVoucher(code: string, payment_id: string, signal?: AbortSignal) {
  return post<RedeemVoucherResponse>("/api/vouchers/redeem", { code, payment_id }, signal);
}
