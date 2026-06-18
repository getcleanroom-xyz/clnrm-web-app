import Link from "next/link";

function DataStreams() {
  const streams = [
    { left: "20%", height: "60%", duration: "3.2s", delay: "0s" },
    { left: "45%", height: "40%", duration: "4.5s", delay: "1.2s" },
    { left: "70%", height: "55%", duration: "3.8s", delay: "0.6s" },
    { left: "90%", height: "35%", duration: "5s", delay: "2s" },
    { left: "110%", height: "50%", duration: "4s", delay: "0.3s" },
  ];

  return (
    <div className="absolute right-12 top-0 bottom-0 w-[200px] opacity-50 hidden lg:block">
      {streams.map((s, i) => (
        <div
          key={i}
          className="absolute top-[-100%] w-px"
          style={{
            left: s.left,
            height: s.height,
            background: "linear-gradient(transparent, #00FF41, transparent)",
            animation: `stream-fall ${s.duration} linear ${s.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative min-h-[calc(100vh-60px)] flex flex-col justify-center overflow-hidden py-20 px-5 md:px-12">
      <div className="absolute inset-0 grid-bg [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 60% at 75% 50%, rgba(0,59,15,0.24) 0%, transparent 65%), radial-gradient(ellipse 25% 50% at 10% 25%, rgba(0,255,65,0.035) 0%, transparent 60%)",
        }}
      />
      <DataStreams />

      <div className="relative z-10 max-w-[1100px] mx-auto w-full">
        <div className="section-label mb-4">{'// VIRTUAL DISPOSABLE BROWSER'}</div>
        <h1 className="text-[clamp(44px,6.8vw,88px)] font-bold leading-[0.93] tracking-tight">
          Your browser when
          <br />
          you need it.
          <em className="not-italic text-green block [text-shadow:0_0_60px_rgba(0,255,65,0.32)]">
            Gone when you don&apos;t.
          </em>
        </h1>
        <p className="mt-6 max-w-[460px] text-[15px] text-white-mid leading-[1.9]">
          On-demand virtual browsers that exist only for your session.
          No data retained. No identity stored. Pay with Monero. Gone the
          instant you disconnect.
        </p>
        <div className="flex flex-wrap gap-4 mt-10">
          <Link
            href="/payment"
            className="clip-spell inline-block bg-green-dim/30 border border-green/40 text-green text-[13px] font-bold tracking-[0.15em] uppercase px-7 py-3.5 no-underline transition-all duration-200 hover:bg-green-dim/50 hover:border-green hover:[text-shadow:0_0_24px_rgba(0,255,65,0.5)] active:[text-shadow:0_0_44px_rgba(0,255,65,0.9)]"
          >
            Launch Instance &rarr;
          </Link>
          <a
            href="https://api.getcleanroom.xyz/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="clip-spell inline-block border border-white-dim/30 text-white-mid text-[13px] font-bold tracking-[0.15em] uppercase px-7 py-3.5 no-underline transition-all duration-200 hover:border-white-dim/60 hover:text-foreground"
          >
            Explore API
          </a>
        </div>
      </div>
    </section>
  );
}
