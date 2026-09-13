import type { Metadata } from "next";
import BalanceClient from "./balance-client";

export const metadata: Metadata = {
  title: "Balance & Monero Top-Up",
  description:
    "View your CleanRoom balance, recharge with Monero, and keep disposable browser sessions funded without an account or email.",
  alternates: { canonical: "/balance" },
  openGraph: {
    title: "Balance & Monero Top-Up — CleanRoom",
    description:
      "Recharge your CleanRoom balance anonymously with Monero.",
  },
};

export default function BalancePage() {
  return <BalanceClient />;
}