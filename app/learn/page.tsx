import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Guides on Disposable Browsers, Tor, and Privacy",
  description:
    "Operator-written guides on disposable browsers, Tor and .onion sites, and paying for online services anonymously with Monero. Specific, honest, and direct.",
  alternates: { canonical: "/learn" },
};

const guides = [
  {
    href: "/learn/what-is-a-disposable-browser",
    title: "What is a disposable browser?",
    body: "Disposable vs incognito vs VPN vs VM. What actually leaves your machine, and when a throwaway browser is the right tool.",
  },
  {
    href: "/learn/tor-browser-and-onion-sites",
    title: "Tor Browser and .onion sites",
    body: "How Tor routes traffic through three relays, why .onion addresses exist, and the honest limits of Tor anonymity.",
  },
  {
    href: "/learn/pay-online-privately",
    title: "Paying for online services anonymously",
    body: "What Monero hides, how a no-account checkout works, and the mistakes that quietly destroy your anonymity.",
  },
  {
    href: "/faq",
    title: "Frequently asked questions",
    body: "Direct answers on pricing, session limits, data handling, and how CleanRoom works.",
  },
];

export default function LearnPage() {
  return (
    <section className="relative py-16 md:py-20 px-5 md:px-12">
      <div className="absolute inset-0 grid-bg-sm [mask-image:radial-gradient(ellipse_60%_40%_at_50%_0%,black,transparent)]" />
      <div className="relative max-w-[760px] mx-auto">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-white-dim mb-8"
        >
          <Link href="/" className="no-underline link-underline text-white-dim hover:text-foreground">
            Home
          </Link>
          <span aria-hidden="true" className="text-green/60">/</span>
          <span className="text-white-mid">Guides</span>
        </nav>

        <div className="section-label mb-4">{'// GUIDES'}</div>
        <h1 className="text-[clamp(30px,4.2vw,46px)] font-bold leading-[1.08] tracking-tight mb-4">
          How disposable browsers, Tor, and anonymous payments work
        </h1>
        <p className="text-white-mid leading-[1.9] mb-12 max-w-[560px]">
          Written by the people running CleanRoom, from the same infrastructure
          these guides describe. Each one answers the question directly, then
          gives the specifics — including the parts that are not flattering.
        </p>

        <div className="flex flex-col gap-4">
          {guides.map((g) => (
            <Link
              key={g.href}
              href={g.href}
              className="group bg-surface border border-[rgba(0,255,65,0.07)] p-7 no-underline clip-cut-tr transition-all duration-300 hover:border-[rgba(0,255,65,0.18)] hover:shadow-[0_0_40px_rgba(0,255,65,0.05)]"
            >
              <span className="block font-bold text-foreground mb-2 group-hover:text-green transition-colors">
                {g.title}{" "}
                <span aria-hidden="true" className="text-green group-hover:translate-x-1 inline-block transition-transform">
                  &rarr;
                </span>
              </span>
              <span className="block text-[13px] text-white-mid leading-[1.75]">
                {g.body}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}