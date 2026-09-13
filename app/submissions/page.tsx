import type { Metadata } from "next";
import SubmissionsClient from "./submissions-client";

export const metadata: Metadata = {
  title: "Survey Results",
  robots: { index: false, follow: false },
};

export default function SubmissionsPage() {
  return <SubmissionsClient />;
}
