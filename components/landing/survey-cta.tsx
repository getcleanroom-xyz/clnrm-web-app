import Link from "next/link";

export function SurveyCTA() {
  return (
    <section className="py-24 px-5 md:px-12 relative border-t border-b border-[rgba(0,255,65,0.06)]">
      <div className="absolute inset-0 grid-bg-sm [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,black,transparent)]" />

      <div className="relative z-10 max-w-[680px] mx-auto text-center">
        <div className="section-label justify-center mb-4 before:hidden">
          <span className="text-green">{'// SHAPE THE ROADMAP'}</span>
        </div>

        <h2 className="text-[clamp(28px,3.5vw,44px)] font-bold leading-[1.05] tracking-tight">
          You are seeing this before anyone else.
        </h2>

        <p className="mt-4 text-[14px] text-white-mid leading-[1.8] max-w-[480px] mx-auto">
          CleanRoom is in pre-launch. Your input decides what we build next.
          Tell us what you need and we will ship it before we open the doors.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/survey"
            className="clip-spell inline-block bg-green text-void text-[13px] font-bold tracking-[0.15em] uppercase px-8 py-4 no-underline transition-all duration-200 hover:bg-transparent hover:text-green border border-green"
          >
            Take the 3-minute survey &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
