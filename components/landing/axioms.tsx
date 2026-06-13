const axioms = [
  {
    num: "I",
    title: "No Identity",
    body: "We never ask for your name, email, or any personal information. Your payment is anonymous. Your session is ephemeral. There is nothing to link back to you.",
  },
  {
    num: "II",
    title: "No Data",
    body: "The instance has no persistent storage. When the session ends, everything — files, history, cache, logs — is irreversibly destroyed. No backups. No recovery.",
  },
  {
    num: "III",
    title: "No Tracking",
    body: "We do not use analytics, cookies, or tracking pixels. Our infrastructure does not log IP addresses or session metadata. We cannot hand over what we do not have.",
  },
  {
    num: "IV",
    title: "No Middlemen",
    body: "We accept Monero only. No bank, no card processor, no KYC. The payment is peer-to-peer, trustless, and final. We never custody your funds.",
  },
];

export function Axioms() {
  return (
    <section className="py-24 px-5 md:px-12">
      <div className="max-w-[1100px] mx-auto">
        <div className="section-label mb-4">{'// PRIVACY AXIOMS'}</div>
        <h2 className="text-[30px] font-bold mb-4">Four pillars. Zero compromise.</h2>
        <p className="text-[13px] text-white-mid leading-[1.75] max-w-[600px] mb-16">
          These are not marketing claims. They are architectural constraints.
        </p>

        <div className="flex flex-col">
          {axioms.map((a, i) => (
            <div
              key={a.num}
              className={`flex flex-col sm:flex-row gap-4 sm:gap-8 py-8 ${
                i < axioms.length - 1 ? "border-b border-[rgba(0,255,65,0.07)]" : ""
              }`}
            >
              <span className="text-[32px] font-bold text-green/30 leading-none shrink-0 w-12">
                {a.num}
              </span>
              <div>
                <h3 className="text-lg font-bold mb-2">{a.title}</h3>
                <p className="text-[13px] text-white-mid leading-[1.75]">{a.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
