import type { Metadata } from "next";
import PaymentClient from "./payment-client";

export const metadata: Metadata = {
  title: "Launch a Disposable Browser Session",
  description:
    "Start a Tor-routed disposable browser session on demand. Pay with Monero, no account or identity required. Sessions run 10–60 minutes and auto-destruct.",
  alternates: { canonical: "/payment" },
  openGraph: {
    title: "Launch a Disposable Browser Session — CleanRoom",
    description:
      "Pay with Monero, no account required. Sessions run 10–60 minutes and auto-destruct.",
  },
};

export default function PaymentPage() {
  return <PaymentClient />;
}