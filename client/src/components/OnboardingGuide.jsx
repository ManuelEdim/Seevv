import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = "seev_guide_dismissed_v1";

const steps = [
  {
    title: "Upload your CV",
    desc: "Start by uploading your existing CV. This is the foundation — Seevv extracts your experience, skills, and achievements.",
    path: "/cv",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#534ab7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="12" y1="18" x2="12" y2="12" />
        <line x1="9" y1="15" x2="15" y2="15" />
      </svg>
    ),
  },
  {
    title: "Add a job target",
    desc: "Add the roles you want to apply for. Each job becomes a target — Seevv tailors everything around it.",
    path: "/dashboard",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#534ab7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
  {
    title: "Decode the job",
    desc: "Use the Deep Decoder to uncover what the company actually needs — hidden requirements, culture, and ATS keywords.",
    path: "/decoder",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#534ab7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
        <line x1="11" y1="8" x2="11" y2="14" />
        <line x1="8" y1="11" x2="14" y2="11" />
      </svg>
    ),
  },
  {
    title: "Tailor & apply",
    desc: "Get your CV rewritten bullet by bullet, generate a voice-matched cover letter, and export a polished PDF.",
    path: "/cv",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#534ab7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
];

const OnboardingGuide = () => {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [wobble, setWobble] = useState(false);
  const [step, setStep] = useState(0);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;

    const showTimer = setTimeout(() => {
      setShow(true);
      // Slight delay so CSS transition fires after mount
      setTimeout(() => setEntered(true), 20);

      // First wobble after entrance settles
      setTimeout(() => {
        setWobble(true);
        setTimeout(() => setWobble(false), 800);
      }, 600);
    }, 1800);

    return () => clearTimeout(showTimer);
  }, []);

  // Periodic wobble to remind the user
  useEffect(() => {
    if (!show) return;
    const interval = setInterval(() => {
      setWobble(true);
      setTimeout(() => setWobble(false), 800);
    }, 9000);
    return () => clearInterval(interval);
  }, [show]);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setEntered(false);
    setTimeout(() => setShow(false), 300);
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep((s) => s + 1);
    } else {
      handleDismiss();
    }
  };

  const handleGoTo = () => {
    navigate(steps[step].path);
    handleDismiss();
  };

  if (!show) return null;

  const current = steps[step];
  const progress = ((step + 1) / steps.length) * 100;

  return (
    <div
      className={`fixed bottom-6 left-6 z-50 w-72 transition-all duration-300 ${
        entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      } ${wobble ? "animate-wobble-once" : ""}`}
    >
      <div className="bg-white rounded-2xl shadow-modal border border-gray-100 overflow-hidden">

        {/* Header */}
        <div className="bg-brand-600 px-4 pt-4 pb-3">
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-xs text-brand-200 font-medium uppercase tracking-wider">
                Getting started
              </p>
              <p className="text-sm font-semibold text-white mt-0.5">
                Step {step + 1} of {steps.length}
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="text-brand-300 hover:text-white transition-colors p-0.5 cursor-pointer mt-0.5"
              aria-label="Dismiss guide"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-brand-500 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center flex-shrink-0">
              {current.icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-1">
                {current.title}
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">
                {current.desc}
              </p>
            </div>
          </div>
        </div>

        {/* Dot indicators */}
        <div className="px-4 pb-4 flex items-center justify-between">
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

          <div className="flex gap-2">
            <button
              onClick={handleGoTo}
              className="text-xs text-brand-600 hover:text-brand-800 font-medium cursor-pointer transition-colors"
            >
              Go there
            </button>
            <button
              onClick={handleNext}
              className="text-xs px-3 py-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-800 font-medium cursor-pointer transition-colors"
            >
              {step < steps.length - 1 ? "Next →" : "Got it!"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingGuide;
