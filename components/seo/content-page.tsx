import Link from "next/link";

type ContentPageProps = {
  crumb: { label: string; href: string };
  label: string;
  title: string;
  summary?: string;
  publishedAt: string;
  children: React.ReactNode;
};

export function ContentPage({
  crumb,
  label,
  title,
  summary,
  publishedAt,
  children,
}: ContentPageProps) {
  const published = new Date(publishedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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
          <Link href={crumb.href} className="no-underline link-underline text-white-dim hover:text-foreground">
            {crumb.label}
          </Link>
          <span aria-hidden="true" className="text-green/60">/</span>
          <span className="text-white-mid truncate">{title}</span>
        </nav>

        <div className="section-label mb-4">{`// ${label}`}</div>
        <h1 className="text-[clamp(30px,4.2vw,46px)] font-bold leading-[1.08] tracking-tight mb-4">
          {title}
        </h1>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white-dim mb-8">
          <span>
            Published{" "}
            <time dateTime={publishedAt}>{published}</time>
          </span>
          <span aria-hidden="true" className="text-green/50">|</span>
          <span>CleanRoom team</span>
          <span aria-hidden="true" className="text-green/50">|</span>
          <a
            href="mailto:admin@getcleanroom.xyz"
            className="no-underline link-underline text-white-dim hover:text-foreground"
          >
            Questions? Email us
          </a>
        </div>

        {summary ? (
          <p className="text-white-mid leading-[1.9] border-l-2 border-green/40 pl-4 mb-10">
            {summary}
          </p>
        ) : null}

        <article className="seo-prose">{children}</article>

        <div className="mt-16 bg-surface border border-[rgba(0,255,65,0.1)] p-8 clip-panel relative corner-accent">
          <div className="section-label mb-3">{'// TRY IT'}</div>
          <h2 className="text-2xl font-bold mb-3">
            Browse off the record for $0.50.
          </h2>
          <p className="text-[13px] text-white-mid leading-[1.8] mb-6 max-w-[480px]">
            No sign-up, no email, no identity. Pay with Monero and get a
            Tor-routed disposable browser that vanishes when you close it.
          </p>
          <Link
            href="/payment"
            className="clip-spell inline-block bg-green text-void text-[13px] font-bold tracking-[0.15em] uppercase px-7 py-3.5 no-underline transition-all duration-200 hover:bg-transparent hover:text-green border border-green"
          >
            Launch Instance &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}