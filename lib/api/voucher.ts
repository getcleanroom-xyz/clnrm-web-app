import { get, post } from "./client";
import type { VoucherListingsResponse, RedeemVoucherResponse } from "./types";

export function getVoucherListings(
  page: number = 1,
  pageSize: number = 12,
  signal?: AbortSignal,
) {
  return get<VoucherListingsResponse>(
    `/api/vouchers/listings?page=${page}&page_size=${pageSize}`,
    signal,
  );
}

export function redeemVoucher(code: string, payment_id: string, signal?: AbortSignal) {
  return post<RedeemVoucherResponse>("/api/vouchers/redeem", { code, payment_id }, signal);
}
