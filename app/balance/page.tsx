import type { Metadata } from "next";
import BalanceClient from "./balance-client";

export const metadata: Metadata = {
  title: "Balance",
};

export default function BalancePage() {
  return <BalanceClient />;
}
