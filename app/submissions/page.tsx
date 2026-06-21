import type { Metadata } from "next";
import SubmissionsClient from "./submissions-client";

export const metadata: Metadata = {
  title: "Survey Results",
};

export default function SubmissionsPage() {
  return <SubmissionsClient />;
}
