import type { Metadata } from "next";
import { Suspense } from "react";
import BuyVouchersClient from "./buy-vouchers-client";

export const metadata: Metadata = {
  title: "Buy Prepaid Vouchers",
  description:
    "Buy CleanRoom prepaid vouchers to fund disposable browser sessions. Give them away or use them yourself — no account, no identity.",
  alternates: { canonical: "/buy-vouchers" },
  openGraph: {
    title: "Buy Prepaid Vouchers — CleanRoom",
    description:
      "Prepaid CleanRoom vouchers for disposable browser sessions. No account or identity needed.",
  },
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