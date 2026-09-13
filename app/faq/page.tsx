import type { Metadata } from "next";
import { ContentPage } from "@/components/seo/content-page";
import { JsonLd } from "@/components/seo/json-ld";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ — Disposable Browsers, Tor, and Monero Payments",
  description:
    "Direct answers to common questions about CleanRoom disposable browsers: how they compare to incognito and VPNs, Monero payments, session limits, .onion access, and what happens to your data.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "CleanRoom FAQ — Disposable Browsers, Tor, and Monero Payments",
    description:
      "Direct answers on how CleanRoom disposable browsers work, Tor, payments, and data handling.",
  },
};

const publishedAt = "2026-09-13";

const faq: { q: string; a: React.ReactNode; aText: string }[] = [
  {
    q: "What is CleanRoom?",
    a: (
      <>
        <p>
          CleanRoom is a disposable browser service. You pay with Monero, and we
          give you a Tor-routed virtual browser that runs on our servers and is
          streamed into your own tab. There is no account, no email, no
          identity, and nothing to install. When you close the session, the
          browser and every byte of data it touched are destroyed.
        </p>
      </>
    ),
    aText:
      "CleanRoom is a disposable browser service. You pay with Monero, and we give you a Tor-routed virtual browser that runs on our servers and is streamed into your own tab. There is no account, no email, no identity, and nothing to install. When you close the session, the browser and every byte of data it touched are destroyed.",
  },
  {
    q: "Is CleanRoom the same as incognito mode?",
    a: (
      <>
        <p>
          No. Incognito mode runs a browser on <em>your</em> device. It clears
          your local history when you close the window, but your ISP, your
          operating system, and every site you visit still see your IP address
          and your browser fingerprint. CleanRoom runs the browser on our
          servers through the Tor network, so your IP is never exposed to the
          sites you visit, and the entire environment is destroyed when the
          session ends.
        </p>
      </>
    ),
    aText:
      "No. Incognito mode runs a browser on your own device. It clears your local history when you close the window, but your ISP, operating system, and every site you visit still see your IP address and browser fingerprint. CleanRoom runs the browser on our servers through the Tor network, so your IP is never exposed to the sites you visit, and the entire environment is destroyed when the session ends.",
  },
  {
    q: "How is CleanRoom different from a VPN?",
    a: (
      <>
        <p>
          A VPN changes your IP address but keeps the browser on your machine:
          your cookies, fingerprint, history, and other trackers stay intact,
          and you have to trust the VPN provider not to log. CleanRoom moves the
          whole browser environment off your device and routes every connection
          through{" "}
          <Link href="/learn/tor-browser-and-onion-sites">Tor</Link>, then
          deletes it. You do not get a deduplicated IP that is shared by pools
          of customers in the way a consumer VPN serves, and you do not need to
          trust your own machine to keep secrets.
        </p>
      </>
    ),
    aText:
      "A VPN changes your IP address but keeps the browser on your machine: your cookies, fingerprint, history, and other trackers stay intact, and you have to trust the VPN provider not to log. CleanRoom moves the entire browser environment off your device and routes every connection through Tor, then deletes it.",
  },
  {
    q: "Do I need an account or an email to use CleanRoom?",
    a: (
      <>
        <p>
          No. Checkout uses a Monero payment to a unique address generated for
          that checkout. Once the payment has one confirmation, we mint a
          session token and return it directly in the browser. Nothing you can
          email, nothing you can forget to log out of.
        </p>
      </>
    ),
    aText:
      "No. Checkout uses a Monero payment to a unique address generated for that checkout. Once the payment has one confirmation, we mint a session token and return it directly in the browser. Nothing you can email, nothing you can forget to log out of.",
  },
  {
    q: "Why Monero instead of Bitcoin or a credit card?",
    a: (
      <>
        <p>
          Privacy. Every transaction on Bitcoin&apos;s public ledger is visible
          and linkable. Monero hides the sender, the receiver, and the amount,
          and each CleanRoom checkout uses a fresh address, so two payments to
          us (or to anyone) cannot be tied together on-chain. A credit card
          would tie a session directly to your identity — the thing a disposable
          browser exists to avoid. Read more in our guide on{" "}
          <Link href="/learn/pay-online-privately">
            paying for services anonymously
          </Link>
          .
        </p>
      </>
    ),
    aText:
      "Privacy. Every transaction on Bitcoin's public ledger is visible and linkable. Monero hides the sender, receiver, and amount, and each CleanRoom checkout uses a fresh address, so two payments cannot be tied together on-chain. A credit card would tie a session directly to your identity.",
  },
  {
    q: "How much does a session cost, and how long can it run?",
    a: (
      <>
        <p>
          Sessions cost $0.50 as a base fee plus $0.025 per minute, with a
          minimum of 10 minutes and a maximum of 60 minutes. A 30-minute session
          is $1.25. You pay in Monero; the USD amount is converted at checkout.
        </p>
      </>
    ),
    aText:
      "Sessions cost $0.50 as a base fee plus $0.025 per minute, with a minimum of 10 minutes and a maximum of 60 minutes. A 30-minute session is $1.25. You pay in Monero; the USD amount is converted at checkout.",
  },
  {
    q: "What happens to my data when a session ends?",
    a: (
      <>
        <p>
          The container that ran your browser is destroyed. That includes the
          browser profile, cookies, history, downloads, and the temporary files
          it created. We do not keep session logs or browsing records to hand
          you later. If you close the tab or disconnect, the session is gone the
          moment the stream drops — this is the entire point, and it is also why
          you should not use CleanRoom for anything you need to retrieve later.
        </p>
      </>
    ),
    aText:
      "The container that ran your browser is destroyed. That includes the browser profile, cookies, history, downloads, and temporary files it created. We do not keep session logs or browsing records. If you close the tab or disconnect, the session is gone the moment the stream drops.",
  },
  {
    q: "Can I open .onion sites?",
    a: (
      <>
        <p>
          Yes. Every session runs Tor Browser, and the homepage of a session
          links straight to the clean web and .onion services. Sites with
          .onion addresses are reachable directly, which is one of the main
          reasons people use CleanRoom instead of a regular browser without Tor.
        </p>
      </>
    ),
    aText:
      "Yes. Every session runs Tor Browser, and the homepage of a session links straight to the clean web and .onion services. Sites with .onion addresses are reachable directly.",
  },
  {
    q: "Does CleanRoom work with vouchers and balance top-ups?",
    a: (
      <>
        <p>
          Yes. Besides paying per session, you can top up a balance with Monero
          or buy prepaid vouchers. Vouchers are useful if you want to hand
          browsing time to someone without an account, since neither side needs
          to reveal an identity.
        </p>
      </>
    ),
    aText:
      "Yes. Besides paying per session, you can top up a balance with Monero or buy prepaid vouchers. Vouchers let you hand browsing time to someone else without an account or identity.",
  },
  {
    q: "What are CleanRoom's honest limitations?",
    a: (
      <>
        <p>
          Because a session is disposable and lives on our servers, it is not a
          personal computer. Nothing persists between sessions, sessions cap at
          60 minutes, and the session depends on an uninterrupted connection to
          the stream. Tor also slows browsing noticeably on some sites, and some
          sites actively block Tor exit nodes no matter what browser you use. We
          do not hide those tickets: if a site refuses Tor traffic, CleanRoom
          will not force its way in. For the same reason, do not use CleanRoom
          for tasks where losing the session is unacceptable — keep a dedicated
          machine for that.
        </p>
      </>
    ),
    aText:
      "Sessions are disposable and live on our servers, so nothing persists between sessions, sessions cap at 60 minutes, and the session depends on an uninterrupted connection to the stream. Tor slows some sites and some sites block Tor exit nodes. Do not use CleanRoom for tasks where losing the session is unacceptable.",
  },
  {
    q: "What happens if my connection drops mid-session?",
    a: (
      <>
        <p>
          The session is tied to the live stream. If the connection drops and
          cannot be re-established, the session is destroyed like any other
          closed session. This is why we recommend not paying for a maximum-length
          session on an unreliable connection, and why a 10-minute session is a
          sensible first test.
        </p>
      </>
    ),
    aText:
      "The session is tied to the live stream. If the connection drops and cannot be re-established, the session is destroyed like any other closed session. Start with a shorter session on an unstable connection.",
  },
  {
    q: "Is CleanRoom open source?",
    a: (
      <>
        <p>
          The frontend (this site and the session viewer) is open source on{" "}
          <a
            href="https://github.com/getcleanroom-xyz/clnrm-web-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          , and the backend is reachable through a public API documented at{" "}
          <a
            href="https://api.getcleanroom.xyz/docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            api.getcleanroom.xyz/docs
          </a>
          . Anyone can audit how the payment flow and session lifecycle are
          wired together.
        </p>
      </>
    ),
    aText:
      "The frontend is open source on GitHub at github.com/getcleanroom-xyz/clnrm-web-app, and the backend is reachable through a public API documented at api.getcleanroom.xyz/docs.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.aText,
    },
  })),
};

export default function FaqPage() {
  return (
    <>
      <JsonLd data={faqSchema} />
      <ContentPage
        crumb={{ label: "FAQ", href: "/faq" }}
        label="FAQ"
        title="Frequently asked questions, answered directly"
        summary="Is CleanRoom the same as incognito? Do I need an account? What happens to my data? Short, direct answers — not a marketing page."
        publishedAt={publishedAt}
      >
        {faq.map((item) => (
          <section key={item.q}>
            <h2>{item.q}</h2>
            {item.a}
          </section>
        ))}

        <h2>Still not answered?</h2>
        <p>
          Email{" "}
          <a href="mailto:admin@getcleanroom.xyz">admin@getcleanroom.xyz</a> and
          we will respond directly. Before you ask, the standard questions about
          pricing, session length, and Tor behavior are all covered in the{" "}
          <Link href="/learn/what-is-a-disposable-browser">
            disposable browser guide
          </Link>
          .
        </p>
      </ContentPage>
    </>
  );
}