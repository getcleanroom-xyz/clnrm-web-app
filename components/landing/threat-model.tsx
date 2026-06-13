const threats = [
  {
    title: "Your ISP knows everything",
    body: "Every site, every message, every purchase logged and stored. Your browsing history is a product they sell.",
  },
  {
    title: "Apps are surveillance tools",
    body: "Your phone reports home constantly — location, contacts, usage patterns, even screen time. You are the product.",
  },
  {
    title: "Data breaches are inevitable",
    body: "Every service you trust with your data will eventually leak it. Passwords, addresses, payment details — all exposed.",
  },
  {
    title: "Digital identity is permanent",
    body: "Every account, every post, every search is linked to you forever. There is no delete button on the internet.",
  },
];

export function ThreatModel() {
  return (
    <section
      id="threats"
      className="py-24 px-5 md:px-12"
      style={{
        background:
          "radial-gradient(ellipse 55% 40% at 50% 50%, rgba(0,59,15,0.18) 0%, transparent 65%)",
      }}
    >
      <div className="max-w-[1100px] mx-auto">
        <div className="section-label mb-4">{'// THREAT MODEL'}</div>
        <h2 className="text-[30px] font-bold mb-4">The internet is not private.</h2>
        <p className="text-[13px] text-white-mid leading-[1.75] max-w-[600px] mb-16">
          Your data is collected, analyzed, and monetized at every layer. CleanRoom breaks the chain.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {threats.map((t) => (
            <div
              key={t.title}
              className="bg-surface border border-[rgba(0,255,65,0.07)] p-7 relative corner-accent clip-cut-tr transition-all duration-300 hover:border-[rgba(0,255,65,0.16)] hover:shadow-[0_0_40px_rgba(0,255,65,0.045)]"
            >
              <div className="flex items-start gap-4">
                <span className="text-green text-lg mt-0.5 shrink-0">&rarr;</span>
                <div>
                  <h3 className="font-bold mb-2">{t.title}</h3>
                  <p className="text-[13px] text-white-mid leading-[1.75]">{t.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
