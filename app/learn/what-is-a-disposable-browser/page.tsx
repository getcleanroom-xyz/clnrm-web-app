import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/seo/content-page";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";

export const metadata: Metadata = {
  title: "What Is a Disposable Browser?",
  description:
    "A disposable browser is a real browser that runs off your device, then is destroyed when the session ends. Here's how disposable browsing compares to incognito mode, a VPN, and a VM — and when it's the right tool.",
  alternates: { canonical: "/learn/what-is-a-disposable-browser" },
  openGraph: {
    title: "What Is a Disposable Browser? — CleanRoom",
    description:
      "Disposable vs incognito vs VPN: what actually leaves your machine, and when a throwaway browser is the right call.",
  },
};

const url = `${SITE_URL}/learn/what-is-a-disposable-browser`;
const publishedAt = "2026-09-13";
const modifiedAt = "2026-09-13";

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "What Is a Disposable Browser?",
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
    { "@type": "ListItem", position: 3, name: "What Is a Disposable Browser?", item: url },
  ],
};

export default function DisposableBrowserGuide() {
  return (
    <>
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbSchema} />
      <ContentPage
        crumb={{ label: "Learn", href: "/learn" }}
        label="Guide"
        title="What is a disposable browser?"
        summary="A disposable browser is a real browser that runs on a remote machine and is destroyed when you close it. Unlike incognito mode it removes your IP; unlike a VPN it also removes the browser itself. This is the tool for a clean slate you do not have to wipe yourself."
        publishedAt={publishedAt}
      >
        <p>
          A disposable browser is an ordinary browser that does not live on your
          device. It starts in an isolated remote environment, does whatever job
          you give it, and is permanently deleted when the session ends. The
          browser profile, cookies, history, downloaded files — everything is
          destroyed together. The version of this you can use without owning
          extra hardware is a service like <Link href="/">CleanRoom</Link>: a
          Tor-routed browser rendered over VNC into a tab, paid for with Monero,
          gone the instant you disconnect.
        </p>

        <h2>How is a disposable browser different from incognito mode?</h2>
        <p>
          Incognito mode is your own browser holding a different attitude. It
          still runs on <strong>your</strong> device, on{" "}
          <strong>your</strong> IP address, with your browser fingerprint and
          extensions. Incognito only declines to save history locally. The site
          you visit, your ISP, and your operating system all see that you were
          there. A disposable browser runs the entire session on another
          machine, so the site sees a different IP and a fresh fingerprint, and
          your ISP sees only a connection to that machine.
        </p>

        <h2>How is it different from a VPN?</h2>
        <p>
          A VPN reroutes your traffic so the destination sees the VPN&apos;s IP
          instead of yours, but the browser stays on your machine. Your cookies,
          fingerprint, and saved logins travel with you. Many VPNs also keep
          connection logs, and consumer VPNs are routinely criticized for exact
          claims and truthful ones being mixed into the same sentence. A
          disposable browser does not need to trust you to log out of anything:
          the profile simply does not exist after the session. See the{" "}
          <Link href="/faq">
            comparison in our FAQ
          </Link>{" "}
          for the table form.
        </p>

        <h2>How is it different from running a virtual machine yourself?</h2>
        <p>
          A VM is closer: you clone a known-clean Windows or Linux image, run it
          on your laptop, use it, then discard the disk. It works, and it is the
          approach a lot of people who need a truly clean slate use. The
          differences are practical. You need the storage to run the VM, the
          time to maintain the image, and the discipline to never log anything
          onto it. The VM still egresses from your own IP unless you also route
          it over Tor or a VPN. A disposable browser service abstracts that
          whole stack: the container, the network path, the teardown. It costs
          less than the electricity a persistent VM draws, and it is available
          on a laptop that has no space for a 30 GB image.
        </p>

        <h2>What does a disposable session actually look like?</h2>
        <p>
          With CleanRoom the flow is: pick a duration (10–60 minutes), pay in
          Monero, and a session token comes back. Behind that token, our backend
          starts an isolated container, boots a Tor Browser profile with a fresh
          identity, and streams it to your tab over a WebSocket VNC connection
          — the same protocol a remote-admin tool uses, but in your browser. You
          click, type, and watch a real browser for the duration. When you close
          the tab or the stream drops, the container is destroyed. There is no
          pause button, and there is no recovery.
        </p>

        <h2>When you genuinely want a disposable browser</h2>
        <ul>
          <li>
            <strong>Opening something you do not trust</strong> — an attachment
            link, a sketchy file, a site that behaves aggressively. The blast
            radius is one container that is about to be deleted.
          </li>
          <li>
            <strong>Windows you do not want traced to your IP</strong> —
            checking something at the edge of your interests without a permanent
            link to your browser identity.
          </li>
          <li>{" "}
            <strong>Accessing .onion services</strong> — Tor inside the session
            makes them reachable in one click.
          </li>
          <li>
            <strong>Research that should not leak into your main browser</strong>{" "}
            — no autofill, no history, no recommendation engine catching up.
          </li>
        </ul>

        <h2>When a disposable browser is the wrong tool</h2>
        <ul>
          <li>
            <strong>Work you must retrieve</strong> — if the session ends, the
            work ends. Anything worth losing is worth keeping somewhere
            permanent first.
          </li>
          <li>
            <strong>Long-running tasks</strong> — sessions cap at 60 minutes.
            A build, a download, an overnight job belong on a VM you control.
          </li>
          <li>
            <strong>Sites that ban Tor</strong> — some services block known Tor
            exit nodes outright. The disposable browser will not talk your way
            in.
          </li>
          <li>
            <strong>Anything where you would run from the law</strong> — this is
            a privacy tool for ordinary people protecting ordinary traffic.
            It will not help you anywhere a court order and an ISP meet.
          </li>
        </ul>

        <h2>The one-minute mental model</h2>
        <ol>
          <li>
            <strong>Incognito</strong>: hide the history, keep the identity.
          </li>
          <li>
            <strong>VPN</strong>: change the IP, keep the browser and its data.
          </li>
          <li>
            <strong>VM</strong>: change everything, but run and maintain it
            yourself.
          </li>
          <li>
            <strong>Disposable browser</strong>: change everything, and delete
            it when you are done. That is what CleanRoom is.
          </li>
        </ol>

        <h2>Related guides</h2>
        <ul>
          <li>
            <Link href="/learn/tor-browser-and-onion-sites">
              Tor Browser and .onion sites — what you can open and what Tor
              still cannot hide
            </Link>
          </li>
          <li>
            <Link href="/learn/pay-online-privately">
              Paying for services anonymously with Monero — how it actually
              works
            </Link>
          </li>
          <li>
            <Link href="/faq">
              CleanRoom FAQ — pricing, session limits, and data handling
            </Link>
          </li>
        </ul>

        <p>
          Ready to try a session instead of reading about it?{" "}
          <Link href="/payment">
            Launch a disposable browser now
          </Link>{" "}
          — 10 minutes costs 75 cents.
        </p>
      </ContentPage>
    </>
  );
}