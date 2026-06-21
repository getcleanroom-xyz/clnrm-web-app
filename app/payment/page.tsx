import type { Metadata } from "next";
import PaymentClient from "./payment-client";

export const metadata: Metadata = {
  title: "Pay for a Session",
};

export default function PaymentPage() {
  return <PaymentClient />;
}
