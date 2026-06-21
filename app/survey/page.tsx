import type { Metadata } from "next";
import SurveyClient from "./survey-client";

export const metadata: Metadata = {
  title: "Survey",
};

export default function SurveyPage() {
  return <SurveyClient />;
}
