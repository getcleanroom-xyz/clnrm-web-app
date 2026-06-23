const steps = [
  {
    num: "01",
    title: "Connect",
    body: "Pick your duration (10–60 min) and pay with Monero. No account, no email, no identity. Your wallet is all you need.",
  },
  {
    num: "02",
    title: "Browse",
    body: "Stream a Tor Browser session directly in your tab. Every packet is triple-encrypted through Tor. Open .onion sites, use it like a normal browser, leave no trace.",
  },
  {
    num: "03",
    title: "Vanish",
    body: "Close the session. The container, the network, and every byte of data are wiped instantly. No logs, no history, no recovery.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="py-24 px-5 md:px-12">
      <div className="max-w-[1100px] mx-auto">
        <div className="section-label mb-4">{'// HOW IT WORKS'}</div>
        <h2 className="text-[30px] font-bold mb-16">Three commands. One clean exit.</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-[2px] bg-[rgba(0,255,65,0.07)] clip-panel">
          {steps.map((step) => (
            <div
              key={step.num}
              className="bg-surface p-8 md:p-10 relative corner-accent flex flex-col"
            >
              <span className="text-[40px] font-bold text-green/20 leading-none mb-4">{step.num}</span>
              <h3 className="text-lg font-bold mb-3">{step.title}</h3>
              <p className="text-[13px] text-white-mid leading-[1.75] flex-1">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
