"use client";

import { useState } from "react";
import { ArrowRight, Check, Spinner } from "@phosphor-icons/react";
import { submitSurvey } from "@/lib/api/survey";

const roles = [
  { value: "security-researcher", label: "Security Researcher" },
  { value: "privacy-user", label: "Privacy-Conscious User" },
  { value: "developer", label: "Developer / Engineer" },
  { value: "journalist", label: "Journalist / Activist" },
  { value: "other", label: "Other" },
];

const featureOptions = [
  { value: "anonymous-browsing", label: "Anonymous browsing with Tor" },
  { value: "sms-verification", label: "SMS / phone verification (virtual SIM)" },
  { value: "malware-analysis", label: "Safe room for malware analysis" },
  { value: "untraceable-research", label: "Untraceable OSINT research" },
  { value: "disposable-email", label: "Disposable email inbox" },
  { value: "app-testing", label: "App testing in a clean environment" },
  { value: "general-privacy", label: "General privacy / no tracking" },
  { value: "other-feature", label: "Other" },
];

const priceOptions = [
  { value: "under-2", label: "Under $2.00" },
  { value: "2-to-3", label: "$2.00 – $3.00" },
  { value: "3-to-5", label: "$3.00 – $5.00" },
  { value: "over-5", label: "Over $5.00" },
];

export default function SurveyPage() {
  const [role, setRole] = useState("");
  const [useCase, setUseCase] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [concern, setConcern] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  function toggleFeature(value: string) {
    setFeatures((prev) =>
      prev.includes(value) ? prev.filter((f) => f !== value) : [...prev, value]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      await submitSurvey({
        role,
        use_case: useCase,
        features,
        concern,
        price_range: priceRange,
        email,
      });
      setSubmitted(true);
    } catch {
      setError("Failed to submit. Please try again.");
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
            We will not spam you — if you left your email, we will only
            reach out if we have a specific question about your feedback.
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
            determine what we build next. Takes about 3 minutes.
          </p>
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

          {/* Features */}
          <fieldset>
            <legend className="text-xs tracking-[0.1em] uppercase text-green mb-3">
              Which features matter most to you?
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {featureOptions.map((f) => (
                <label
                  key={f.value}
                  className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors text-sm ${
                    features.includes(f.value)
                      ? "border-green bg-green/5 text-foreground"
                      : "border-[rgba(0,255,65,0.12)] bg-surface text-white-dim hover:border-[rgba(0,255,65,0.3)]"
                  }`}
                >
                  <input
                    type="checkbox"
                    value={f.value}
                    checked={features.includes(f.value)}
                    onChange={() => toggleFeature(f.value)}
                    className="appearance-none w-4 h-4 border border-green shrink-0 flex items-center justify-center checked:bg-green checked:shadow-[inset_0_0_0_2px_#0A0A0A]"
                  />
                  {f.label}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Concern */}
          <fieldset>
            <legend className="text-xs tracking-[0.1em] uppercase text-green mb-3">
              What is your biggest hesitation or concern?
            </legend>
            <textarea
              value={concern}
              onChange={(e) => setConcern(e.target.value)}
              placeholder="What would make you hesitant to use CleanRoom?"
              rows={3}
              className="w-full bg-surface border border-[rgba(0,255,65,0.12)] p-3 text-sm font-mono text-foreground placeholder:text-white-dim/40 resize-none focus:outline-none focus:border-green transition-colors"
            />
          </fieldset>

          {/* Price */}
          <fieldset>
            <legend className="text-xs tracking-[0.1em] uppercase text-green mb-3">
              What price point feels fair for a 30-minute session?
            </legend>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {priceOptions.map((p) => (
                <label
                  key={p.value}
                  className={`flex items-center justify-center p-3 border cursor-pointer transition-colors text-sm ${
                    priceRange === p.value
                      ? "border-green bg-green/5 text-foreground"
                      : "border-[rgba(0,255,65,0.12)] bg-surface text-white-dim hover:border-[rgba(0,255,65,0.3)]"
                  }`}
                >
                  <input
                    type="radio"
                    name="price"
                    value={p.value}
                    checked={priceRange === p.value}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="sr-only"
                  />
                  {p.label}
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
