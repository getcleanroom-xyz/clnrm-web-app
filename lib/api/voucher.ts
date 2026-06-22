import { get, post } from "./client";
import type { VoucherListingsResponse, RedeemVoucherResponse, MintVoucherResponse, MintStatusResponse } from "./types";

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

export function mintVoucher(device_id: string, signal?: AbortSignal) {
  return post<MintVoucherResponse>("/api/vouchers/mint", { device_id }, signal);
}

export function getMintStatus(device_id: string, signal?: AbortSignal) {
  return get<MintStatusResponse>(`/api/vouchers/mint-status?device_id=${encodeURIComponent(device_id)}`, signal);
}
