"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Spinner } from "@phosphor-icons/react";
import { submitSurvey } from "@/lib/api/survey";
import { toast } from "@/lib/toast";
import { formatPricing } from "@/lib/constants";

const roles = [
  { value: "security-researcher", label: "Security Researcher" },
  { value: "privacy-user", label: "Privacy-Conscious User" },
  { value: "developer", label: "Developer / Engineer" },
  { value: "journalist", label: "Journalist / Activist" },
  { value: "other", label: "Other" },
];

const features = [
  { id: "tor-browsing", label: "Anonymous browsing via Tor" },
  { id: "phone-verification", label: "Phone number verification via API" },
  { id: "disposable-email", label: "Disposable email inbox" },
  { id: "dedicated-ip", label: "Dedicated IP (non-Tor egress)" },
  { id: "clipboard-sync", label: "Clipboard sync with your machine" },
  { id: "file-transfer", label: "File transfer to / from session" },
  { id: "persistent-storage", label: "Persistent storage across sessions" },
  { id: "session-recording", label: "Session recording & replay" },
  { id: "malware-analysis", label: "Safe room for malware analysis" },
  { id: "webapp-testing", label: "Sandbox for web app testing" },
];

const importanceLevels = [
  { value: "not-needed", label: "Not needed", short: "No" },
  { value: "nice-to-have", label: "Nice to have", short: "+1" },
  { value: "important", label: "Important", short: "+2" },
  { value: "critical", label: "Critical", short: "+3" },
];

const fairnessOptions = [
  { value: "too-high", label: "Too expensive" },
  { value: "fair", label: "Fair for what it does" },
  { value: "underpriced", label: "I would pay more" },
];

const referralOptions = [
  { value: "twitter", label: "Twitter / X" },
  { value: "github", label: "GitHub" },
  { value: "hn", label: "Hacker News" },
  { value: "friend", label: "Friend / colleague" },
  { value: "search", label: "Search engine" },
  { value: "other-ref", label: "Other" },
];

const CURRENT_PRICE = formatPricing(30);

type ImportanceMap = Record<string, string>;

export default function SurveyPage() {
  const router = useRouter();
  const [role, setRole] = useState("");
  const [useCase, setUseCase] = useState("");
  const [featureImportance, setFeatureImportance] = useState<ImportanceMap>({});
  const [mustHave, setMustHave] = useState("");
  const [missingFeature, setMissingFeature] = useState("");
  const [priceFairness, setPriceFairness] = useState("");
  const [referral, setReferral] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  function setFeatureLevel(featureId: string, level: string) {
    setFeatureImportance((prev) => ({ ...prev, [featureId]: level }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      await submitSurvey({
        role,
        use_case: useCase,
        feature_importance: featureImportance,
        must_have: mustHave,
        missing_feature: missingFeature,
        price_fairness: priceFairness,
        referral,
        email,
      });
      setSubmitted(true);
      localStorage.setItem("clnrm_survey_submitted", "true");
      toast.success("Response recorded. Redirecting to roadmap...");
      const redirectTimer = setTimeout(() => router.push("/submissions"), 1500);
      return () => clearTimeout(redirectTimer);
    } catch {
      setError("Failed to submit. Please try again.");
      toast.error("Failed to submit survey.");
    } finally {
      setSending(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-[calc(100vh-60px)] flex items-center justify-center px-5">
        <div className="max-w-lg w-full text-center">
          <div className="w-12 h-12 rounded-none bg-green/10 border border-green flex items-center justify-center mx-auto mb-6">
            <Check size={24} className="text-green" />
          </div>
          <h1 className="text-xl font-bold tracking-[0.1em] uppercase mb-3">
            Response recorded
          </h1>
          <p className="text-white-dim text-sm leading-relaxed">
            Thanks for your input. CleanRoom will be better because of it.
            Redirecting you to the live roadmap...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-60px)] flex justify-center px-5 py-20">
      <div className="max-w-2xl w-full">
        <div className="mb-10">
          <p className="section-label mb-3">Survey</p>
          <h1 className="text-2xl font-bold tracking-[0.1em] uppercase mb-3">
            Shape what CleanRoom becomes
          </h1>
          <p className="text-white-dim text-sm leading-relaxed max-w-lg">
            You are one of the first people to see this. Your answers will
            determine what we build next. Takes about 3 minutes. After you
            submit, you will get a live look at how everyone else is
            shaping the roadmap.
          </p>

          <div className="mt-6 p-4 border-l-2 border-green/40 bg-green/5 text-sm text-white-mid leading-relaxed">
            <p>
              CleanRoom gives you a temporary virtual browser session —
              completely separate from your real device. Use it privately,
              close it when you are done, and nothing survives. No account
              needed. Pay what you use: $1.00 + $0.05/min.
            </p>
            <Link
              href="/"
              className="inline-block mt-2 text-xs tracking-[0.1em] uppercase text-green no-underline link-underline"
            >
              Learn more &rarr;
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Role */}
          <fieldset>
            <legend className="text-xs tracking-[0.1em] uppercase text-green mb-3">
              What best describes you?
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {roles.map((r) => (
                <label
                  key={r.value}
                  className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors text-sm ${
                    role === r.value
                      ? "border-green bg-green/5 text-foreground"
                      : "border-[rgba(0,255,65,0.12)] bg-surface text-white-dim hover:border-[rgba(0,255,65,0.3)]"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r.value}
                    checked={role === r.value}
                    onChange={(e) => setRole(e.target.value)}
                    className="appearance-none w-4 h-4 border border-green shrink-0 flex items-center justify-center checked:bg-green checked:shadow-[inset_0_0_0_2px_#0A0A0A]"
                  />
                  {r.label}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Use case */}
          <fieldset>
            <legend className="text-xs tracking-[0.1em] uppercase text-green mb-3">
              What would you use CleanRoom for?
            </legend>
            <textarea
              value={useCase}
              onChange={(e) => setUseCase(e.target.value)}
              placeholder="Tell us about your use case..."
              rows={3}
              className="w-full bg-surface border border-[rgba(0,255,65,0.12)] p-3 text-sm font-mono text-foreground placeholder:text-white-dim/40 resize-none focus:outline-none focus:border-green transition-colors"
            />
          </fieldset>

          {/* Feature importance matrix */}
          <fieldset>
            <legend className="text-xs tracking-[0.1em] uppercase text-green mb-1">
              Rate each feature by importance
            </legend>
            <p className="text-white-dim/50 text-xs mb-4">
              Tap a level for each feature. Leave unrated if you have no opinion.
            </p>

            {/* Column headers — hidden on mobile */}
            <div className="hidden sm:grid sm:grid-cols-[1fr_80px_80px_80px_80px] gap-2 mb-2 px-3">
              <div />
              {importanceLevels.map((l) => (
                <div
                  key={l.value}
                  className="text-[10px] tracking-[0.1em] uppercase text-white-dim/50 text-center"
                >
                  {l.short}
                </div>
              ))}
            </div>

            <div className="space-y-1">
              {features.map((f) => (
                <div
                  key={f.id}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_80px_80px_80px_80px] gap-1 sm:gap-2 p-3 bg-surface border border-[rgba(0,255,65,0.06)]"
                >
                  <span className="text-sm text-foreground mb-2 sm:mb-0 self-center">
                    {f.label}
                  </span>
                  {importanceLevels.map((l) => (
                    <label
                      key={l.value}
                      className={`flex sm:justify-center items-center gap-2 sm:gap-0 p-2 sm:p-3 border cursor-pointer transition-colors text-xs ${
                        featureImportance[f.id] === l.value
                          ? "border-green bg-green/5 text-green"
                          : "border-[rgba(0,255,65,0.12)] text-white-dim hover:border-[rgba(0,255,65,0.3)]"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`feat-${f.id}`}
                        value={l.value}
                        checked={featureImportance[f.id] === l.value}
                        onChange={() => setFeatureLevel(f.id, l.value)}
                        className="sr-only"
                      />
                      <span className="sm:hidden">{l.label}</span>
                      <span className="hidden sm:inline">{l.short}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </fieldset>

          {/* Must-have */}
          <fieldset>
            <legend className="text-xs tracking-[0.1em] uppercase text-green mb-3">
              What would make CleanRoom a must-have for you?
            </legend>
            <textarea
              value={mustHave}
              onChange={(e) => setMustHave(e.target.value)}
              placeholder="The one thing that would make this indispensable..."
              rows={3}
              className="w-full bg-surface border border-[rgba(0,255,65,0.12)] p-3 text-sm font-mono text-foreground placeholder:text-white-dim/40 resize-none focus:outline-none focus:border-green transition-colors"
            />
          </fieldset>

          {/* Missing feature */}
          <fieldset>
            <legend className="text-xs tracking-[0.1em] uppercase text-green mb-3">
              Anything we missed?
            </legend>
            <textarea
              value={missingFeature}
              onChange={(e) => setMissingFeature(e.target.value)}
              placeholder="A feature you need that is not on our radar..."
              rows={2}
              className="w-full bg-surface border border-[rgba(0,255,65,0.12)] p-3 text-sm font-mono text-foreground placeholder:text-white-dim/40 resize-none focus:outline-none focus:border-green transition-colors"
            />
          </fieldset>

          {/* Price fairness */}
          <fieldset>
            <legend className="text-xs tracking-[0.1em] uppercase text-green mb-3">
              Our current pricing: <span className="text-foreground">{CURRENT_PRICE}</span>
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {fairnessOptions.map((p) => (
                <label
                  key={p.value}
                  className={`flex items-center justify-center p-3 border cursor-pointer transition-colors text-sm ${
                    priceFairness === p.value
                      ? "border-green bg-green/5 text-foreground"
                      : "border-[rgba(0,255,65,0.12)] bg-surface text-white-dim hover:border-[rgba(0,255,65,0.3)]"
                  }`}
                >
                  <input
                    type="radio"
                    name="price"
                    value={p.value}
                    checked={priceFairness === p.value}
                    onChange={(e) => setPriceFairness(e.target.value)}
                    className="sr-only"
                  />
                  {p.label}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Referral */}
          <fieldset>
            <legend className="text-xs tracking-[0.1em] uppercase text-green mb-3">
              How did you hear about CleanRoom?
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {referralOptions.map((r) => (
                <label
                  key={r.value}
                  className={`flex items-center justify-center p-3 border cursor-pointer transition-colors text-sm ${
                    referral === r.value
                      ? "border-green bg-green/5 text-foreground"
                      : "border-[rgba(0,255,65,0.12)] bg-surface text-white-dim hover:border-[rgba(0,255,65,0.3)]"
                  }`}
                >
                  <input
                    type="radio"
                    name="referral"
                    value={r.value}
                    checked={referral === r.value}
                    onChange={(e) => setReferral(e.target.value)}
                    className="sr-only"
                  />
                  {r.label}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Email */}
          <fieldset>
            <legend className="text-xs tracking-[0.1em] uppercase text-green mb-2">
              Email <span className="text-white-dim/50">(optional)</span>
            </legend>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Only if we can follow up with you"
              className="w-full bg-surface border border-[rgba(0,255,65,0.12)] p-3 text-sm font-mono text-foreground placeholder:text-white-dim/40 focus:outline-none focus:border-green transition-colors"
            />
          </fieldset>

          {error && (
            <p className="text-error text-xs tracking-[0.05em]">{error}</p>
          )}

          <button
            type="submit"
            disabled={sending || !role}
            className="flex items-center gap-2 px-6 py-3 bg-green text-void text-xs tracking-[0.1em] uppercase font-bold border border-green hover:bg-transparent hover:text-green transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            {sending ? (
              <Spinner size={16} className="animate-spin" />
            ) : (
              <ArrowRight size={16} />
            )}
            {sending ? "Submitting..." : "Submit Response"}
          </button>
        </form>
      </div>
    </div>
  );
}
