import Link from "next/link";

const topics = [
  {
    href: "/learn/what-is-a-disposable-browser",
    label: "What is a disposable browser?",
    body: "How it compares to incognito mode, a VPN, and a virtual machine — and why the browser itself has to move off your device.",
  },
  {
    href: "/learn/tor-browser-and-onion-sites",
    label: "Tor Browser and .onion sites",
    body: "What accessing .onion sites actually means, how Tor routes traffic, and where it still can't help you.",
  },
  {
    href: "/learn/pay-online-privately",
    label: "Paying for services anonymously",
    body: "How to pay with Monero, why a unique address per checkout matters, and what happens after you send a payment.",
  },
];

export function SeoText() {
  return (
    <section className="py-24 px-5 md:px-12">
      <div className="max-w-[1100px] mx-auto">
        <div className="section-label mb-4">{'// WHY CLEANROOM'}</div>
        <h2 className="text-[30px] font-bold mb-6">
          A browser that leaves the room when you do.
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-12">
          <div className="text-white-mid text-[14px] leading-[1.9] space-y-4">
            <p>
              CleanRoom is a disposable browser service. When you launch a
              session, a real Tor Browser instance starts on our servers, not on
              your machine, and is streamed into your tab. Everything it does
              runs inside an isolated container with a fresh identity: new
              fingerprint, new network path, no cookies carried in from
              anywhere. Close the session and the container is destroyed — the
              same way a temporary file under /tmp is gone after a reboot.
            </p>
            <p>
              This is the difference between hiding and disappearing. Incognito
              mode hides history on your own device but keeps your IP, your
              fingerprint, and every site both you and the browser touch. A VPN
              replaces your IP but leaves cookies, trackers, and browser
              fingerprint intact, and it trusts the provider to keep no logs.
              CleanRoom moves the entire browsing environment off your device
              and routes it through Tor, then deletes it. What you would need a
              dedicated machine (or a live USB you never let out of your hands)
              to achieve yourself, costs $0.50 plus $0.025 a minute and exists
              for 10 to 60 minutes.
            </p>
            <p>
              Because the service is paid with{" "}
              <Link href="/learn/pay-online-privately" className="text-green no-underline link-underline">
                Monero
              </Link>{" "}
              and requires no account, no email, and no identity, the payment
              itself does not link a session back to you. The checkout generates
              a unique address per payment rather than reusing a shared one, so
              two payments to CleanRoom cannot be tied together on the
              blockchain. Payment is settled after a single confirmation, and
              the session token is minted automatically — nothing about you is
              stored in the process.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {topics.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className="group bg-surface border border-[rgba(0,255,65,0.07)] p-6 no-underline clip-cut-tr transition-all duration-300 hover:border-[rgba(0,255,65,0.18)] hover:shadow-[0_0_40px_rgba(0,255,65,0.05)]"
              >
                <span className="block text-xs tracking-[0.15em] uppercase text-green mb-2">
                  Learn &rarr;
                </span>
                <span className="block font-bold text-foreground mb-2 group-hover:text-green transition-colors">
                  {t.label}
                </span>
                <span className="block text-[13px] text-white-mid leading-[1.75]">
                  {t.body}
                </span>
              </Link>
            ))}
            <Link
              href="/faq"
              className="group bg-surface/50 border border-dashed border-[rgba(0,255,65,0.14)] p-6 no-underline clip-cut-tr transition-all duration-300 hover:border-[rgba(0,255,65,0.3)]"
            >
              <span className="block text-xs tracking-[0.15em] uppercase text-green mb-2">
                FAQ &rarr;
              </span>
              <span className="block font-bold text-foreground mb-2 group-hover:text-green transition-colors">
                Common questions, direct answers
              </span>
              <span className="block text-[13px] text-white-mid leading-[1.75]">
                Pricing, session limits, Tor, payments, and what happens to your
                data when a session ends.
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}