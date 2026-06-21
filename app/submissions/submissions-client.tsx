"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Envelope,
  Spinner,
  Users,
} from "@phosphor-icons/react";
import { getSurveyResults, requestContactOtp, verifyContactOtp } from "@/lib/api/survey";
import type { AnonymizedSubmission, SurveyResults } from "@/lib/api/types";
import { RoadmapViz } from "@/components/submissions/roadmap-viz";

const ROLE_LABELS: Record<string, string> = {
  "security-researcher": "Security Researcher",
  "privacy-user": "Privacy-Conscious User",
  developer: "Developer / Engineer",
  journalist: "Journalist / Activist",
  other: "Other",
};

const FEATURE_LABELS: Record<string, string> = {
  "tor-browsing": "Tor Browsing",
  "phone-verification": "Phone Verification",
  "disposable-email": "Email Inbox",
  "dedicated-ip": "Dedicated IP",
  "clipboard-sync": "Clipboard Sync",
  "file-transfer": "File Transfer",
  "persistent-storage": "Persistent Storage",
  "session-recording": "Session Recording",
  "malware-analysis": "Malware Analysis",
  "webapp-testing": "Web App Testing",
};

const LEVEL_COLORS: Record<string, string> = {
  "not-needed": "#003311",
  "nice-to-have": "#006622",
  important: "#00CC33",
  critical: "#00FF41",
};

function AnimatedCounter({ value, label }: { value: number; label: string }) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    startRef.current = performance.now();
    const duration = 1500;

    function tick(now: number) {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(eased * value));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value]);

  return (
    <div className="text-center">
      <div className="text-[48px] md:text-[64px] font-bold text-green leading-none tabular-nums">
        {display}
      </div>
      <div className="text-xs tracking-[0.1em] uppercase text-white-dim mt-2">
        {label}
      </div>
    </div>
  );
}

function FeatureMatrix({
  distribution,
}: {
  distribution: Record<string, Record<string, number>>;
}) {
  const levels = ["not-needed", "nice-to-have", "important", "critical"];

  return (
    <div className="overflow-x-auto">
      <div className="grid gap-0.5" style={{ gridTemplateColumns: "160px repeat(4, 1fr)" }}>
        <div className="text-[10px] tracking-[0.1em] uppercase text-white-dim/50 p-2" />
        {levels.map((l) => (
          <div
            key={l}
            className="text-[10px] tracking-[0.1em] uppercase text-white-dim/50 p-2 text-center"
          >
            {l.replace("-", " ")}
          </div>
        ))}
        {Object.entries(distribution).map(([fid, dist]) => (
          <FeatureMatrixRow
            key={fid}
            featureId={fid}
            distribution={dist}
            levels={levels}
          />
        ))}
      </div>
    </div>
  );
}

function FeatureMatrixRow({
  featureId,
  distribution,
  levels,
}: {
  featureId: string;
  distribution: Record<string, number>;
  levels: string[];
}) {
  const total = Object.values(distribution).reduce((a, b) => a + b, 0) || 1;

  return (
    <>
      <div className="text-xs text-foreground p-2 truncate">
        {FEATURE_LABELS[featureId] || featureId}
      </div>
      {levels.map((level) => {
        const count = distribution[level] || 0;
        const pct = (count / total) * 100;
        return (
          <div key={level} className="p-1 flex items-center justify-center">
            <div
              className="h-8 w-full flex items-center justify-center text-[10px] font-bold transition-all duration-500"
              style={{
                backgroundColor: LEVEL_COLORS[level],
                opacity: 0.2 + pct / 100 * 0.8,
              }}
            >
              {count > 0 ? count : ""}
            </div>
          </div>
        );
      })}
    </>
  );
}

function BarChart({
  data,
  label,
}: {
  data: Record<string, number>;
  label: (key: string) => string;
}) {
  const total = Object.values(data).reduce((a, b) => a + b, 0) || 1;
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-2">
      {entries.map(([key, count]) => {
        const pct = (count / total) * 100;
        return (
          <div key={key}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-white-dim">{label(key)}</span>
              <span className="text-green tabular-nums">{count}</span>
            </div>
            <div className="h-2 bg-[rgba(0,255,65,0.06)]">
              <div
                className="h-full bg-green transition-all duration-1000"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SubmissionCard({
  sub,
  onContact,
}: {
  sub: AnonymizedSubmission;
  onContact: (index: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="p-4 bg-surface border border-[rgba(0,255,65,0.06)] transition-colors hover:border-[rgba(0,255,65,0.15)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[10px] tracking-[0.1em] uppercase text-green border border-green/30 px-2 py-0.5">
              {ROLE_LABELS[sub.role] || sub.role}
            </span>
            <span className="text-[10px] text-white-dim/50">
              {new Date(sub.submitted_at).toLocaleDateString()}
            </span>
          </div>

          {sub.use_case && (
            <p className="text-sm text-foreground mb-2 line-clamp-2">
              {sub.use_case}
            </p>
          )}

          {expanded && (
            <div className="mt-3 space-y-2 text-xs">
              {sub.must_have && (
                <p>
                  <span className="text-green">Must-have: </span>
                  <span className="text-white-dim">{sub.must_have}</span>
                </p>
              )}
              {sub.missing_feature && (
                <p>
                  <span className="text-green">Missing: </span>
                  <span className="text-white-dim">{sub.missing_feature}</span>
                </p>
              )}
            </div>
          )}

          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[10px] tracking-[0.05em] uppercase text-white-dim/50 hover:text-foreground transition-colors mt-1"
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        </div>

        {sub.email_masked && (
          <button
            onClick={() => onContact(sub.index)}
            className="shrink-0 p-2 border border-[rgba(0,255,65,0.12)] text-white-dim hover:text-green hover:border-green transition-colors"
            title={`Contact ${sub.email_masked}`}
          >
            <Envelope size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

function ContactModal({
  submissionIndex,
  maskedEmail,
  onClose,
}: {
  submissionIndex: number;
  maskedEmail: string;
  onClose: () => void;
}) {
  const [step, setStep] = useState<"message" | "otp" | "sent" | "error">("message");
  const [message, setMessage] = useState("");
  const [token, setToken] = useState("");
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [errorText, setErrorText] = useState("");

  async function handleRequestOtp() {
    setSending(true);
    setErrorText("");
    try {
      const res = await requestContactOtp(submissionIndex, message);
      setToken(res.detail);
      setStep("otp");
    } catch {
      setErrorText("Failed to request OTP. Try again.");
    } finally {
      setSending(false);
    }
  }

  async function handleVerify() {
    setSending(true);
    setErrorText("");
    try {
      await verifyContactOtp(token, otp);
      setStep("sent");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid OTP. Try again.";
      setErrorText(message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(0,0,0,0.7)] p-5">
      <div className="w-full max-w-md bg-surface border border-[rgba(0,255,65,0.15)] p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white-dim hover:text-foreground text-sm"
        >
          ✕
        </button>

        {step === "sent" ? (
          <div className="text-center py-6">
            <Check size={24} className="text-green mx-auto mb-3" />
            <p className="text-sm text-foreground">
              Message forwarded to {maskedEmail}.
            </p>
          </div>
        ) : (
          <>
            <h3 className="text-xs tracking-[0.1em] uppercase text-green mb-1">
              Contact respondent
            </h3>
            <p className="text-xs text-white-dim mb-4">
              Your message will be forwarded to {maskedEmail}. Their email
              stays hidden. An OTP will be sent to your admin email to verify
              your identity.
            </p>

            {step === "message" && (
              <>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your message..."
                  rows={4}
                  className="w-full bg-[rgba(0,0,0,0.3)] border border-[rgba(0,255,65,0.12)] p-3 text-sm font-mono text-foreground placeholder:text-white-dim/40 resize-none focus:outline-none focus:border-green mb-4"
                />
                <button
                  onClick={handleRequestOtp}
                  disabled={sending || !message.trim()}
                  className="w-full py-3 bg-green text-void text-xs tracking-[0.1em] uppercase font-bold border border-green hover:bg-transparent hover:text-green transition-colors disabled:opacity-40"
                >
                  {sending ? "Sending OTP..." : "Send OTP to admin email"}
                </button>
              </>
            )}

            {step === "otp" && (
              <>
                <p className="text-xs text-white-dim mb-3">
                  Enter the 6-digit code sent to your admin email.
                </p>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="w-full bg-[rgba(0,0,0,0.3)] border border-[rgba(0,255,65,0.12)] p-3 text-sm font-mono text-foreground text-center tracking-[0.3em] focus:outline-none focus:border-green mb-4"
                  maxLength={6}
                />
                <button
                  onClick={handleVerify}
                  disabled={sending || otp.length < 6}
                  className="w-full py-3 bg-green text-void text-xs tracking-[0.1em] uppercase font-bold border border-green hover:bg-transparent hover:text-green transition-colors disabled:opacity-40"
                >
                  {sending ? "Verifying..." : "Verify & Send"}
                </button>
              </>
            )}

            {errorText && (
              <p className="text-error text-xs mt-3">{errorText}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function SubmissionsClient() {
  const [data, setData] = useState<SurveyResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contactIndex, setContactIndex] = useState<number | null>(null);

  useEffect(() => {
    const abort = new AbortController();

    (async () => {
      try {
        const results = await getSurveyResults(abort.signal);
        if (abort.signal.aborted) return;
        setData(results);
        setError(null);
      } catch {
        if (!abort.signal.aborted) {
          setError("Failed to load survey data. The backend may be unavailable.");
        }
      } finally {
        if (!abort.signal.aborted) setLoading(false);
      }
    })();

    const interval = setInterval(async () => {
      try {
        const results = await getSurveyResults(abort.signal);
        if (abort.signal.aborted) return;
        setData(results);
        setError(null);
      } catch {}
    }, 30000);

    return () => {
      abort.abort();
      clearInterval(interval);
    };
  }, []);

  const contactSub = data?.recent.find((s) => s.index === contactIndex);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-60px)] flex items-center justify-center">
        <Spinner size={24} className="text-green animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-60px)] flex items-center justify-center px-5">
        <div className="text-center max-w-sm">
          <div className="text-lg font-bold text-error mb-2">Connection error</div>
          <p className="text-xs text-white-dim leading-relaxed mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 border border-green/40 text-green text-xs font-bold tracking-[0.15em] uppercase px-5 py-2.5 transition-all hover:bg-green-dim/30"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-60px)] px-5 md:px-12 py-16">
      <div className="max-w-6xl mx-auto">
        {/* Hero */}
        <div className="py-12 md:py-20 text-center border-b border-[rgba(0,255,65,0.06)] mb-12">
          <p className="section-label justify-center mb-4 before:hidden">
            <span className="text-green">{'// THE CLEANROOM EVOLUTION'}</span>
          </p>
          <h1 className="text-[clamp(24px,3vw,40px)] font-bold tracking-tight mb-6">
            Shaped by everyone who shows up
          </h1>
          <p className="text-white-dim text-sm max-w-lg mx-auto mb-10">
            Every submission is a signal. Watch the roadmap move in real time
            as the community votes on what matters most.
          </p>
          <AnimatedCounter value={data?.total || 0} label="Total Responses" />
        </div>

        {data && data.total > 0 ? (
          <div className="space-y-16">
            {/* Feature Importance Matrix */}
            <section>
              <h2 className="text-lg font-bold tracking-[0.1em] uppercase mb-2">
                Feature Heat Map
              </h2>
              <p className="text-white-dim text-xs mb-6">
                Darker cells = more votes for that importance level.
              </p>
              <FeatureMatrix distribution={data.feature_distribution} />
            </section>

            {/* Roadmap Visualization */}
            <section>
              <h2 className="text-lg font-bold tracking-[0.1em] uppercase mb-2">
                Living Roadmap
              </h2>
              <p className="text-white-dim text-xs mb-6">
                Node size = community importance score. Watch submissions
                fly in as particles and feed the map.
              </p>
              <RoadmapViz
                phases={data.roadmap}
                totalSubmissions={data.total}
              />
            </section>

            {/* Secondary widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Role distribution */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Users size={16} className="text-green" />
                  <h3 className="text-sm font-bold tracking-[0.1em] uppercase">
                    Who is responding
                  </h3>
                </div>
                <BarChart
                  data={data.roles}
                  label={(k) => ROLE_LABELS[k] || k}
                />
              </section>

              {/* Price fairness */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-green text-sm">$</span>
                  <h3 className="text-sm font-bold tracking-[0.1em] uppercase">
                    Price sentiment
                  </h3>
                </div>
                <BarChart
                  data={data.price_fairness}
                  label={(k) =>
                    ({
                      "too-high": "Too expensive",
                      fair: "Fair price",
                      underpriced: "Would pay more",
                    })[k] || k
                  }
                />
              </section>

              {/* Referral sources */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <ArrowRight size={16} className="text-green" />
                  <h3 className="text-sm font-bold tracking-[0.1em] uppercase">
                    Where they come from
                  </h3>
                </div>
                <BarChart
                  data={data.referrals}
                  label={(k) =>
                    ({
                      twitter: "Twitter / X",
                      github: "GitHub",
                      hn: "Hacker News",
                      friend: "Friend",
                      search: "Search engine",
                      "other-ref": "Other",
                    })[k] || k
                  }
                />
              </section>

              {/* Top must-haves */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Check size={16} className="text-green" />
                  <h3 className="text-sm font-bold tracking-[0.1em] uppercase">
                    Top must-haves
                  </h3>
                </div>
                {data.top_must_haves.length > 0 ? (
                  <div className="space-y-2">
                    {data.top_must_haves.map((text, i) => (
                      <div
                        key={i}
                        className="p-3 bg-surface border-l-2 border-green/40 text-sm text-white-dim"
                      >
                        {text}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white-dim/50 text-xs">No responses yet.</p>
                )}
              </section>
            </div>

            {/* Recent submissions feed */}
            <section>
              <h2 className="text-lg font-bold tracking-[0.1em] uppercase mb-2">
                Recent Voices
              </h2>
              <p className="text-white-dim text-xs mb-6">
                Anonymized submissions from the community. Contact a
                respondent via masked email (admin OTP required).
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.recent
                  .slice()
                  .reverse()
                  .map((sub) => (
                    <SubmissionCard
                      key={sub.index}
                      sub={sub}
                      onContact={setContactIndex}
                    />
                  ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-white-dim text-sm mb-4">
              No submissions yet. Be the first.
            </p>
            <a
              href="/survey"
              className="inline-flex items-center gap-1.5 bg-green-dim/30 border border-green/40 text-green text-xs font-bold tracking-[0.15em] uppercase px-5 py-2.5 transition-all hover:bg-green-dim/50"
            >
              Take the survey
            </a>
          </div>
        )}

        {contactSub && (
          <ContactModal
            submissionIndex={contactSub.index}
            maskedEmail={contactSub.email_masked || "unknown"}
            onClose={() => setContactIndex(null)}
          />
        )}
      </div>
    </div>
  );
}
