const truths = [
  { label: "Base Fee", value: "$0.50" },
  { label: "Per Minute", value: "$0.025" },
  { label: "Min Session", value: "10 min" },
  { label: "Max Session", value: "60 min" },
];

export function TruthStrip() {
  return (
    <section className="border-y border-[rgba(0,255,65,0.07)] bg-surface">
      <div className="max-w-[1100px] mx-auto px-5 md:px-12">
        <div className="flex flex-col sm:flex-row">
          {truths.map((t, i) => (
            <div
              key={t.label}
              className={`flex-1 flex flex-col items-center py-6 px-4 ${
                i < truths.length - 1
                  ? "border-b sm:border-b-0 sm:border-r border-[rgba(0,255,65,0.07)]"
                  : ""
              }`}
            >
              <span className="text-[11px] tracking-[0.2em] uppercase text-white-dim mb-1">{t.label}</span>
              <span className="text-[28px] font-bold text-green">{t.value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
