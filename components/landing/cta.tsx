import Link from "next/link";

export function CTA() {
  return (
    <section
      className="py-32 px-5 md:px-12 text-center relative overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at 50% 50%, rgba(0,255,65,0.04) 0%, transparent 70%)",
      }}
    >
      <div className="absolute inset-0 grid-bg-sm [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,black,transparent)]" />

      <div className="relative z-10 max-w-[600px] mx-auto">
        <div className="section-label justify-center mb-4 before:hidden">
          <span className="text-green">{'// DEPLOY YOUR SANDBOX'}</span>
        </div>
        <h2 className="text-[clamp(32px,4vw,52px)] font-bold leading-[1.05] tracking-tight">
          Ready to disappear?
        </h2>
        <p className="mt-4 text-[14px] text-white-mid leading-[1.8] max-w-[420px] mx-auto">
          No sign-up. No email. No identity. Just a clean browser session and
          the peace of mind that nothing survives.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-10">
          <Link
            href="/payment"
            className="clip-spell inline-block bg-green-dim/30 border border-green/40 text-green text-[13px] font-bold tracking-[0.15em] uppercase px-8 py-4 no-underline transition-all duration-200 hover:bg-green-dim/50 hover:border-green hover:[text-shadow:0_0_24px_rgba(0,255,65,0.5)]"
          >
            Launch Instance &rarr;
          </Link>
          <a
            href="https://github.com/getcleanroom-xyz/clnrm-web-app"
            target="_blank"
            rel="noopener noreferrer"
            className="clip-spell inline-block border border-white-dim/30 text-white-mid text-[13px] font-bold tracking-[0.15em] uppercase px-8 py-4 no-underline transition-all duration-200 hover:border-white-dim/60 hover:text-foreground"
          >
            View Source
          </a>
        </div>
      </div>
    </section>
  );
}
