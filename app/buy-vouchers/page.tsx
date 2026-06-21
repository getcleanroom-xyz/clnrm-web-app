import type { Metadata } from "next";
import { Suspense } from "react";
import BuyVouchersClient from "./buy-vouchers-client";

export const metadata: Metadata = {
  title: "Buy Vouchers",
};

export default function BuyVouchersPage() {
  return (
    <Suspense
      fallback={
        <div className="relative min-h-[calc(100vh-60px)] flex items-center justify-center">
          <div className="text-xs tracking-[0.15em] uppercase text-white-dim">Loading...</div>
        </div>
      }
    >
      <BuyVouchersClient />
    </Suspense>
  );
}
