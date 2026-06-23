import { Fragment } from "react";

const comparisons = [
  { feature: "Anonymous sign-up", cleanroom: true, others: "Email + phone required" },
  { feature: "Private payment", cleanroom: true, others: "Credit card / PayPal" },
  { feature: "Auto-destruct on disconnect", cleanroom: true, others: "Data retained" },
  { feature: "No IP logging", cleanroom: true, others: "Logged and stored" },
  { feature: "Tor-routed browsing", cleanroom: true, others: "Your IP exposed" },
  { feature: ".onion site access", cleanroom: true, others: "Requires Tor Browser" },
  { feature: "Open source", cleanroom: true, others: "Proprietary" },
  { feature: "Stream in browser", cleanroom: true, others: "App install required" },
  { feature: "No cookies or trackers", cleanroom: true, others: "Ads + analytics" },
];

export function Comparison() {
  return (
    <section id="pricing" className="py-24 px-5 md:px-12 bg-surface/50">
      <div className="max-w-[1100px] mx-auto">
        <div className="section-label mb-4">{'// COMPARISON'}</div>
        <h2 className="text-[30px] font-bold mb-16">What you get vs. what you avoid.</h2>

        <div className="overflow-x-auto">
          <div className="min-w-[600px] border border-[rgba(0,255,65,0.07)] clip-panel">
            <div className="grid grid-cols-[1fr_120px_1fr] gap-0 text-[11px] uppercase tracking-[0.15em]">
              <div className="p-4 border-b border-[rgba(0,255,65,0.07)] text-white-dim">Feature</div>
              <div className="p-4 border-b border-[rgba(0,255,65,0.07)] text-green text-center font-bold">
                CleanRoom
              </div>
              <div className="p-4 border-b border-[rgba(0,255,65,0.07)] text-white-dim">Alternatives</div>

              {comparisons.map((c) => (
                <Fragment key={c.feature}>
                  <div className="p-4 text-xs border-b border-[rgba(0,255,65,0.04)] last:border-b-0">
                    {c.feature}
                  </div>
                  <div className="p-4 text-xs text-green text-center border-b border-[rgba(0,255,65,0.04)] last:border-b-0 flex items-center justify-center">
                    {c.cleanroom ? (
                      <span className="text-green text-sm font-bold">{'\u2713'}</span>
                    ) : (
                      <span className="text-error text-sm">{'\u00D7'}</span>
                    )}
                  </div>
                  <div className="p-4 text-xs text-white-mid border-b border-[rgba(0,255,65,0.04)] last:border-b-0">
                    {c.others}
                  </div>
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
