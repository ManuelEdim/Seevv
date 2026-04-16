import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = "seev_guide_v3";

const steps = [
  {
    title: "Upload your CV",
    desc: "Start by uploading your existing CV. Seevv reads it and extracts your experience, skills, and achievements automatically.",
    path: "/cv",
    tourPath: "/cv",
    cta: "Go to My CVs",
    emoji: "📄",
    color: "from-brand-600 to-brand-700",
  },
  {
    title: "Add a job target",
    desc: "Add the roles you want to apply for from your Dashboard. Each job becomes a target — Seevv tailors everything around it.",
    path: "/dashboard",
    tourPath: "/dashboard",
    cta: "Go to Dashboard",
    emoji: "🎯",
    color: "from-teal-600 to-teal-700",
  },
  {
    title: "Decode the job description",
    desc: "Use Deep Decoder to uncover hidden requirements, culture signals, and ATS keywords employers actually care about.",
    path: "/decoder",
    tourPath: "/decoder",
    cta: "Try Deep Decoder",
    emoji: "🔍",
    color: "from-amber-500 to-amber-600",
  },
  {
    title: "Tailor your CV",
    desc: "Seevv rewrites your CV bullet by bullet, tailored to the job. Then export a polished PDF or generate a cover letter.",
    path: "/cv",
    tourPath: "/cv",
    cta: "Go to My CVs",
    emoji: "✨",
    color: "from-brand-600 to-brand-700",
  },
  {
    title: "Set your voice sample",
    desc: "Go to Profile and paste 200+ words of your own writing. Seevv will mirror your voice so every rewrite sounds like you — not AI.",
    path: "/profile",
    tourPath: "/profile",
    cta: "Go to Profile",
    emoji: "🎤",
    color: "from-indigo-500 to-indigo-600",
  },
];

// Pulse dot that attaches to a sidebar nav item
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
    return () => {
      window.removeEventListener("resize", measure);
      cancelAnimationFrame(rafRef.current);
    };
  }, [targetPath]);

  if (!pos) return null;

  return (
    <div
      className="fixed z-[60] pointer-events-none"
      style={{ top: pos.top - 6, left: pos.left - 6 }}
    >
      {/* Outer ping */}
      <span className="absolute inline-flex h-3 w-3 rounded-full bg-brand-400 opacity-75 animate-ping" />
      {/* Inner solid */}
      <span className="relative inline-flex h-3 w-3 rounded-full bg-brand-600" />
    </div>
  );
};

const OnboardingGuide = () => {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const [entered, setEntered] = useState(false);
  const [minimised, setMinimised] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;
    const t = setTimeout(() => {
      setShow(true);
      setTimeout(() => setEntered(true), 20);
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setEntered(false);
    setTimeout(() => setShow(false), 300);
  };

  const handleNext = () => {
    if (step < steps.length - 1) setStep((s) => s + 1);
    else handleDismiss();
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleGoTo = () => {
    navigate(steps[step].path);
    handleDismiss();
  };

  if (!show) return null;

  const current = steps[step];
  const progress = ((step + 1) / steps.length) * 100;

  // Minimised pill
  if (minimised) {
    return (
      <div
        className={`fixed bottom-6 left-6 z-50 transition-all duration-300 ${
          entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        <button
          onClick={() => setMinimised(false)}
          className="flex items-center gap-2 bg-brand-600 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg hover:bg-brand-700 transition-colors cursor-pointer"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>
          Getting started · Step {step + 1}/{steps.length}
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Pulse dot highlighting the active nav item */}
      <PulseDot targetPath={current.tourPath} />

      {/* Guide card */}
      <div
        className={`fixed bottom-6 left-6 z-50 w-76 transition-all duration-300 ${
          entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
        style={{ width: "310px" }}
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">

          {/* Gradient header */}
          <div className={`bg-gradient-to-r ${current.color} px-4 pt-4 pb-3`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{current.emoji}</span>
                <div>
                  <p className="text-[10px] text-white/70 font-semibold uppercase tracking-widest">
                    Getting started · {step + 1}/{steps.length}
                  </p>
                  <p className="text-sm font-bold text-white mt-0.5 leading-tight">
                    {current.title}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <button
                  onClick={() => setMinimised(true)}
                  className="text-white/60 hover:text-white transition-colors p-1 cursor-pointer rounded"
                  aria-label="Minimise"
                  title="Minimise"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
                <button
                  onClick={handleDismiss}
                  className="text-white/60 hover:text-white transition-colors p-1 cursor-pointer rounded"
                  aria-label="Dismiss"
                  title="Dismiss guide"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-white/20 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Body */}
          <div className="px-4 py-4">
            <p className="text-xs text-gray-500 leading-relaxed mb-4">
              {current.desc}
            </p>

            {/* Pulse hint */}
            <div className="flex items-center gap-2 bg-brand-50 border border-brand-100 rounded-lg px-3 py-2 mb-4">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-600" />
              </span>
              <p className="text-xs text-brand-700 font-medium">
                See the pulsing dot in the sidebar ↑
              </p>
            </div>

            {/* Step dots */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    className={`rounded-full transition-all duration-300 cursor-pointer ${
                      i === step
                        ? "w-5 h-1.5 bg-brand-600"
                        : i < step
                        ? "w-1.5 h-1.5 bg-brand-300"
                        : "w-1.5 h-1.5 bg-gray-200"
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                {step > 0 && (
                  <button
                    onClick={handleBack}
                    className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                  >
                    ← Back
                  </button>
                )}
                <button
                  onClick={handleGoTo}
                  className="text-xs text-brand-600 hover:text-brand-800 font-semibold cursor-pointer transition-colors"
                >
                  {current.cta}
                </button>
                <button
                  onClick={handleNext}
                  className="text-xs px-3 py-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-semibold cursor-pointer transition-colors"
                >
                  {step < steps.length - 1 ? "Next →" : "Done ✓"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OnboardingGuide;
