import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/seo/content-page";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";

export const metadata: Metadata = {
  title: "Tor Browser and .onion Sites: What They Are and How to Open Them",
  description:
    "TOR is not a tool for the dark web — it is a privacy network. Learn why .onion addresses exist, how Tor routes your traffic through three relays, and the honest limits of anonymity on Tor.",
  alternates: { canonical: "/learn/tor-browser-and-onion-sites" },
  openGraph: {
    title: "Tor Browser and .onion Sites — CleanRoom",
    description:
      "How Tor routes your traffic, why .onion addresses exist, and the limits of Tor anonymity.",
  },
};

const url = `${SITE_URL}/learn/tor-browser-and-onion-sites`;
const publishedAt = "2026-09-13";
const modifiedAt = "2026-09-13";

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Tor Browser and .onion Sites: What They Are and How to Open Them",
  description: SITE_DESCRIPTION,
  image: [`${SITE_URL}/opengraph-image`],
  datePublished: publishedAt,
  dateModified: modifiedAt,
  inLanguage: "en",
  author: {
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
  },
  publisher: {
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
  },
  mainEntityOfPage: { "@type": "WebPage", "@id": url },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Learn", item: `${SITE_URL}/learn` },
    { "@type": "ListItem", position: 3, name: "Tor Browser and .onion Sites", item: url },
  ],
};

export default function TorBrowserGuide() {
  return (
    <>
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbSchema} />
      <ContentPage
        crumb={{ label: "Learn", href: "/learn" }}
        label="Guide"
        title="Tor Browser and .onion sites: what they are and how to open them"
        summary="A .onion address is a site that only accepts traffic through the Tor network. Tor moves your traffic through three independently operated relays so no single one knows both who you are and what site you are reaching. Onion sites are not 'the dark web' — they are sites that decided regular DNS and IP addressing do not protect them well enough."
        publishedAt={publishedAt}
      >
        <h2>What is a .onion address?</h2>
        <p>
          A <em>.onion</em> address is the hostname of a service that is exposed
          only through the Tor network. Normal sites live at IP addresses listed
          in public DNS; if you know where a server is, you can attack it, block
          it, or subpoena its host. An onion service hides its location behind
          a<strong> rendezvous point</strong>. The address itself is a random
          string derived from the service&apos;s public key, which is why onion
          addresses look like a line of generated spam. The site operator gets a
          domain nobody can seize by asking the registry, because there is no
          registry.
        </p>

        <h2>How Tor actually routes your traffic</h2>
        <p>
          When you open a site through Tor, your browser builds a circuit through
          three relays selected from the public Tor network: a guard (entry)
          node, a middle node, and an exit node. Each hop decrypts one layer of
          the bundle, like peeling an onion. The three relays are operated by
          different people in different places, and each relay only knows its
          immediate neighbors in the chain.
        </p>
        <ul>
          <li>
            <strong>Guard node</strong>: knows your IP address, but has no idea
            what site you are visiting.
          </li>
          <li>
            <strong>Middle node</strong>: knows neither your IP nor the
            destination.
          </li>
          <li>
            <strong>Exit node</strong>: knows the destination and connects to
            it, but has no idea who you are.
          </li>
        </ul>
        <p>
          This is how Tor solves the trust problem: you only need to trust that
          the three operators are not all the same person working together.
          Because they are dispersed and anonymous volunteers, collusion is
          hard. The name &quot;onion&quot; comes from this encryption layering,
          and it is also why every CleanRoom session runs Tor Browser by
          default: the network path is handled inside the session, on our side,
          not on your machine.
        </p>

        <h2>Why do sites use .onion addresses?</h2>
        <p>
          For services whose users need them, the reasons are concrete:
        </p>
        <ul>
          <li>
            <strong>Location hiding</strong> — nobody can find the server to
            knock it offline. This is why whistleblowing outlets and some news
            organizations operate onion mirrors.
          </li>
          <li>
            <strong>Anti-censorship</strong> — a domain cannot be taken down by
            a registrar, and a DNS filter cannot block a hostname it cannot see.
          </li>
          <li>
            <strong>End-to-end authenticated connection</strong> — the same
            cryptography that generates the address also authenticates traffic,
            so you can confirm the site is really the one its address claims to
            be, with no CA to compromise.
          </li>
          <li>
            <strong>For the operator, less liability</strong> — a site that
            serves sensitive content (survivor forums, leak platforms, advice
            for at-risk people) can exist without exposing who runs it.
          </li>
        </ul>

        <h2>Does Tor make you anonymous?</h2>
        <p>
          It raises the cost of linking you to your traffic enormously, but it is
          not a magic hood. Three honest limits:
        </p>
        <ul>
          <li>
            <strong>The exit node can see your plaintext</strong> to the final
            site. Tor encrypts between you and the exit node; if the site itself
            is plain HTTP, the exit node reads it. Always prefer HTTPS.
          </li>
          <li>
            <strong>Fingerprinting outlives the circuit</strong>. A browser that
            reports a unique screen size, timezone, or font set advertises who
            it is regardless of IP. Tor Browser works hard to make every user
            look identical for exactly this reason.
          </li>
          <li>
            <strong>Some sites simply refuse</strong> to serve Tor exit nodes.
            For those, no amount of routing helps — which is something you
            should hear from a tool before you pay for it. CleanRoom will not
            claim to force its way past a site that bans Tor.
          </li>
        </ul>

        <h2>How to open .onion sites</h2>
        <p>
          You need a client that speaks the Tor protocol. The standard way is{" "}
          <a
            href="https://www.torproject.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Tor Browser
          </a>
          : a hardened Firefox build that routes everything through Tor and
          spoofs your fingerprint to match the crowd. Install it, let it
          connect, and paste the .onion address into the address bar. Most
          onion sites load slowly the first time because they are personal
          machines on home connections, not CDN-fronted services.
        </p>
        <p>
          The alternative is a service that runs Tor for you, which is how{" "}
          <Link href="/">CleanRoom</Link> works. The Tor Browser profile is
          started inside the disposable session and streamed to your tab, so
          you can open a .onion address from any computer — including a
          locked-down work machine where you cannot install software. You never
          carry Tor on your device at all, and the profile dies with the
          session.
        </p>

        <h2>What the session limits mean for Tor</h2>
        <p>
          Tor is great at privacy and mediocre at speed. Relay selection, the
          extra hops, and onion routing add real latency, and sites behind Tor
          are sometimes run on modest hardware. We cap sessions at 60 minutes
          partly because of that latency: long Tor sessions on a busy circuit
          drift into unusable territory, and a 10–30 minute session keeps you on
          fresh circuits with a responsive browser. If you need to hold a Tor
          connection open for hours, run Tor Browser on a machine you control.
        </p>

        <h2>The honest bottom line</h2>
        <p>
          Tor is a privacy network, not a dark-web badge. It is built and
          funded by the Tor Project, a nonprofit, and its security properties
          are published, debated, and audited in the open. Use it to protect
          ordinary traffic: research you do not want attached to your name,
          reading you do not want your ISP to log, sites that treat their users&apos;IPs as inventory. Everything disreputable that ever rode on Tor —
          marketplaces, abuse, scams — depends on the same infrastructure that
          protects a journalist interviewing a source in a risky country, and
          anti-abuse work happens inside the network too. Judge it the way
          you judge a hammer.
        </p>

        <h2>Related guides</h2>
        <ul>
          <li>
            <Link href="/learn/what-is-a-disposable-browser">
              What is a disposable browser? — the full comparison with incognito
              mode, VPNs, and VMs
            </Link>
          </li>
          <li>
            <Link href="/learn/pay-online-privately">
              Paying for services anonymously with Monero
            </Link>
          </li>
          <li>
            <Link href="/faq">
              CleanRoom FAQ — including what happens to session data on close
            </Link>
          </li>
        </ul>

        <p>
          Want to open a .onion site without installing anything?{" "}
          <Link href="/payment">
            Launch a session
          </Link>{" "}
          (10 minutes, 75 cents, Monero).
        </p>
      </ContentPage>
    </>
  );
}