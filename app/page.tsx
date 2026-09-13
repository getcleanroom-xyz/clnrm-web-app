import type { Metadata } from "next";
import { Hero } from "@/components/landing/hero";
import { TruthStrip } from "@/components/landing/truth-strip";
import { HowItWorks } from "@/components/landing/how-it-works";
import { ThreatModel } from "@/components/landing/threat-model";
import { Axioms } from "@/components/landing/axioms";
import { Comparison } from "@/components/landing/comparison";
import { SeoText } from "@/components/landing/seo-text";
import { CTA } from "@/components/landing/cta";
import { SurveyCTA } from "@/components/landing/survey-cta";
import { JsonLd } from "@/components/seo/json-ld";
import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  SITE_REPO,
  API_DOCS,
  CONTACT_EMAIL,
} from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "CleanRoom — Virtual Disposable Browsers" },
  description: SITE_DESCRIPTION,
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: "https://getcleanroom.xyz/icon.svg",
  },
  description: SITE_DESCRIPTION,
  email: CONTACT_EMAIL,
  sameAs: [SITE_REPO, API_DOCS],
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE_NAME,
  url: SITE_URL,
  applicationCategory: "SecurityApplication",
  operatingSystem: "Web",
  description: SITE_DESCRIPTION,
  offers: {
    "@type": "Offer",
    price: "0.50",
    priceCurrency: "USD",
    priceValidUntil: "2027-12-31",
    description:
      "Base fee per session plus $0.025 per minute. Sessions run 10–60 minutes.",
  },
};

const webSiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  publisher: { "@id": `${SITE_URL}/#organization` },
  inLanguage: "en",
};

export default function Home() {
  return (
    <>
      <JsonLd data={organizationSchema} />
      <JsonLd data={softwareSchema} />
      <JsonLd data={webSiteSchema} />
      <Hero />
      <TruthStrip />
      <HowItWorks />
      <ThreatModel />
      <Axioms />
      <Comparison />
      <SeoText />
      <SurveyCTA />
      <CTA />
    </>
  );
}