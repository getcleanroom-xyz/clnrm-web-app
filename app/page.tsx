import type { Metadata } from "next";
import { Hero } from "@/components/landing/hero";
import { TruthStrip } from "@/components/landing/truth-strip";
import { HowItWorks } from "@/components/landing/how-it-works";
import { ThreatModel } from "@/components/landing/threat-model";
import { Axioms } from "@/components/landing/axioms";
import { Comparison } from "@/components/landing/comparison";
import { CTA } from "@/components/landing/cta";
import { SurveyCTA } from "@/components/landing/survey-cta";

export const metadata: Metadata = {
  title: "CleanRoom — Virtual Disposable Browsers",
};

export default function Home() {
  return (
    <>
      <Hero />
      <TruthStrip />
      <HowItWorks />
      <ThreatModel />
      <Axioms />
      <Comparison />
      <SurveyCTA />
      <CTA />
    </>
  );
}
