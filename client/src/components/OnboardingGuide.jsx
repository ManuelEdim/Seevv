import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = "seev_guide_v4";

const STEPS = [
  {
    n: 1,
    title: "Upload your CV",
    desc: "Upload your existing CV — Seevv reads it and extracts your experience, skills, and achievements automatically.",
    path: "/cv",
    cta: "Go to My CVs",
    color: "from-brand-600 to-brand-700",
    bg: "bg-brand-50",
    border: "border-brand-100",
    text: "text-brand-700",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
  },
  {
    n: 2,
    title: "Add a job target",
    desc: "Add the role you're applying for. Type or speak the job title and Seevv fetches real job descriptions for you to pick from.",
    path: "/dashboard",
    cta: "Go to Dashboard",
    color: "from-teal-600 to-teal-700",
    bg: "bg-teal-50",
    border: "border-teal-100",
    text: "text-teal-700",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    n: 3,
    title: "Decode the job description",
    desc: "Deep Decoder uncovers hidden requirements, ATS keywords, and culture signals that the JD doesn't say out loud.",
    path: "/decoder",
    cta: "Try Deep Decoder",
    color: "from-amber-500 to-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
    text: "text-amber-700",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
    ),
  },
  {
    n: 4,
    title: "Tailor your CV",
    desc: "Seevv rewrites your CV bullet by bullet, tailored to the job description. Export a polished PDF or generate a cover letter.",
    path: "/cv",
    cta: "Go to My CVs",
    color: "from-brand-600 to-brand-700",
    bg: "bg-brand-50",
    border: "border-brand-100",
    text: "text-brand-700",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    n: 5,
    title: "Log your wins",
    desc: "Use the Achievement Journal to capture daily wins and skills — they build into your CV over time.",
    path: "/journal",
    cta: "Open Journal",
    color: "from-indigo-500 to-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-100",
    text: "text-indigo-700",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
];

// Pulse dot that highlights the active sidebar item
const PulseDot = ({ targetPath }) => {
  const [pos, setPos] = useState(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const measure = () => {
      const el = document.querySelector(`[data-tour="${targetPath}"]`);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setPos({ top: rect.top + rect.height / 2, left: rect.right - 10 });
    };
    measure();
    rafRef.current = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => { window.removeEventListener("resize", measure); cancelAnimationFrame(rafRef.current); };
  }, [targetPath]);

  if (!pos) return null;

  return (
    <div className="fixed z-[60] pointer-events-none" style={{ top: pos.top - 6, left: pos.left - 6 }}>
      <span className="absolute inline-flex h-3 w-3 rounded-full bg-brand-400 opacity-75 animate-ping" />
      <span className="relative inline-flex h-3 w-3 rounded-full bg-brand-600" />
    </div>
  );
};

// ─── Welcome screen (shown before step 1) ──────────────────
const WelcomeCard = ({ onStart, onDismiss, entered }) => (
  <div
    className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${entered ? "opacity-100" : "opacity-0"}`}
    style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
  >
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
      {/* Top bar */}
      <div className="bg-linear-to-r from-brand-600 to-brand-700 px-6 pt-6 pb-5 text-white">
        <p className="text-[11px] font-bold uppercase tracking-widest opacity-70 mb-1">Getting started</p>
        <p className="text-xl font-bold leading-tight">Welcome to Seevv</p>
        <p className="text-sm opacity-80 mt-1">Your AI career platform — here's how to get your first tailored CV in 5 steps.</p>
      </div>

      {/* Steps preview */}
      <div className="px-5 py-4 space-y-2">
        {STEPS.map((s) => (
          <div key={s.n} className={`flex items-center gap-3 px-3 py-2 rounded-xl ${s.bg} ${s.border} border`}>
            <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${s.bg.replace("50", "200")} ${s.text} shrink-0`}>
              {s.n}
            </span>
            <span className={`flex items-center gap-1.5 ${s.text}`}>{s.icon}</span>
            <p className="text-xs font-semibold text-gray-800">{s.title}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="px-5 pb-5 flex gap-2">
        <button
          onClick={onDismiss}
          className="flex-1 py-2.5 text-xs text-gray-400 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
        >
          Skip for now
        </button>
        <button
          onClick={onStart}
          className="flex-1 py-2.5 text-xs font-bold bg-brand-600 text-white rounded-xl hover:bg-brand-700 cursor-pointer transition-colors"
        >
          Start guide →
        </button>
      </div>
    </div>
  </div>
);

// ─── Step card ─────────────────────────────────────────────
const StepCard = ({ step, stepIndex, total, onNext, onBack, onGoTo, onMinimise, onDismiss, entered }) => {
  const progress = ((stepIndex + 1) / total) * 100;

  return (
    <>
      <PulseDot targetPath={step.path} />

      <div
        className={`fixed bottom-6 left-6 z-50 w-[320px] transition-all duration-300 ${entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Gradient header */}
          <div className={`bg-linear-to-r ${step.color} px-4 pt-4 pb-3`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className={`flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-white text-xs font-bold shrink-0`}>
                  {step.n}
                </span>
                <div>
                  <p className="text-[10px] text-white/70 font-semibold uppercase tracking-widest">
                    Step {stepIndex + 1} of {total}
                  </p>
                  <p className="text-sm font-bold text-white mt-0.5 leading-tight">{step.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <button onClick={onMinimise} className="text-white/60 hover:text-white transition-colors p-1 cursor-pointer rounded" title="Minimise">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
                <button onClick={onDismiss} className="text-white/60 hover:text-white transition-colors p-1 cursor-pointer rounded" title="Dismiss guide">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-1 bg-white/20 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Body */}
          <div className="px-4 py-4">
            <p className="text-xs text-gray-500 leading-relaxed mb-4">{step.desc}</p>

            {/* Pulse hint */}
            <div className={`flex items-center gap-2 ${step.bg} ${step.border} border rounded-lg px-3 py-2 mb-4`}>
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${step.bg.replace("50", "400")} opacity-75`} />
                <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${step.bg.replace("50", "600")}`} />
              </span>
              <p className={`text-xs ${step.text} font-medium`}>Look for the pulse in the sidebar →</p>
            </div>

            {/* CTA */}
            <button
              onClick={onGoTo}
              className={`w-full text-xs text-center py-2 ${step.bg} ${step.border} border ${step.text} rounded-lg font-semibold hover:opacity-80 cursor-pointer transition-opacity mb-3`}
            >
              {step.cta}
            </button>

            {/* Step dots + navigation */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {STEPS.map((_, i) => (
                  <span
                    key={i}
                    className={`rounded-full transition-all duration-300 ${
                      i === stepIndex ? "w-5 h-1.5 bg-brand-600" : i < stepIndex ? "w-1.5 h-1.5 bg-brand-300" : "w-1.5 h-1.5 bg-gray-200"
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                {stepIndex > 0 && (
                  <button onClick={onBack} className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer transition-colors">
                    ← Back
                  </button>
                )}
                <button
                  onClick={onNext}
                  className="text-xs px-3 py-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-semibold cursor-pointer transition-colors"
                >
                  {stepIndex < total - 1 ? "Next →" : "Done ✓"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Main component ────────────────────────────────────────
const OnboardingGuide = () => {
  const navigate = useNavigate();
  const [phase, setPhase]     = useState("welcome"); // welcome | steps | done
  const [step, setStep]       = useState(0);
  const [entered, setEntered] = useState(false);
  const [minimised, setMinimised] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;
    const t = setTimeout(() => { setPhase("welcome"); setTimeout(() => setEntered(true), 20); }, 900);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setEntered(false);
    setTimeout(() => setPhase("done"), 300);
  };

  const startGuide = () => {
    setEntered(false);
    setTimeout(() => { setPhase("steps"); setTimeout(() => setEntered(true), 20); }, 300);
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else dismiss();
  };

  if (phase === "done") return null;

  if (minimised) {
    return (
      <div className={`fixed bottom-6 left-6 z-50 transition-all duration-300 ${entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
        <button
          onClick={() => setMinimised(false)}
          className="flex items-center gap-2 bg-brand-600 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg hover:bg-brand-700 transition-colors cursor-pointer"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>
          {phase === "welcome" ? "Getting started guide" : `Step ${step + 1}/${STEPS.length} — ${STEPS[step].title}`}
        </button>
      </div>
    );
  }

  if (phase === "welcome") {
    return (
      <WelcomeCard
        entered={entered}
        onStart={startGuide}
        onDismiss={dismiss}
      />
    );
  }

  return (
    <StepCard
      step={STEPS[step]}
      stepIndex={step}
      total={STEPS.length}
      entered={entered}
      onNext={handleNext}
      onBack={() => step > 0 && setStep((s) => s - 1)}
      onGoTo={() => { navigate(STEPS[step].path); dismiss(); }}
      onMinimise={() => setMinimised(true)}
      onDismiss={dismiss}
    />
  );
};

export default OnboardingGuide;
