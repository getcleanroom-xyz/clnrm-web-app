import type { Metadata } from "next";
import SurveyClient from "./survey-client";

export const metadata: Metadata = {
  title: "Shape the CleanRoom Roadmap",
  description:
    "CleanRoom is in pre-launch. Take the 3-minute survey and tell us what a disposable browser should do before we open the doors.",
  alternates: { canonical: "/survey" },
};

export default function SurveyPage() {
  return <SurveyClient />;
}