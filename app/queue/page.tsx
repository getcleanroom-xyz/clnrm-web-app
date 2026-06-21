import type { Metadata } from "next";
import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import QueueClient from "./queue-client";

export const metadata: Metadata = {
  title: "Queue",
};

export default function QueuePage() {
  return (
    <Suspense fallback={
      <div className="relative min-h-[calc(100vh-60px)] flex items-center justify-center">
        <div className="flex items-center gap-3 text-white-mid">
          <span className="text-xs tracking-[0.15em] uppercase">Loading...</span>
        </div>
      </div>
    }>
      <ErrorBoundary>
        <QueueClient />
      </ErrorBoundary>
    </Suspense>
  );
}
