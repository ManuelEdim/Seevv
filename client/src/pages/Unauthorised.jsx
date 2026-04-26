import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store";
import { PLAN_LABELS } from "@/lib/features";

const Unauthorised = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const profile = useAuthStore((s) => s.profile);

  const plan = profile?.plan || "free";
  const planLabel = PLAN_LABELS[plan] || "Free";

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden bg-[#f8f9fc]">

      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-100px] left-[-80px] w-[440px] h-[440px] rounded-full bg-coral-100 opacity-30 blur-[100px]" />
        <div className="absolute bottom-[-80px] right-[-60px] w-[380px] h-[380px] rounded-full bg-brand-100 opacity-35 blur-[90px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[280px] rounded-full bg-amber-50 opacity-60 blur-[120px]" />
      </div>

      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #033876 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          opacity: 0.04,
        }}
      />

      <div className="relative z-10 text-center max-w-lg w-full">

        {/* Shield illustration */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 blur-2xl bg-coral-300 opacity-20 rounded-full scale-150" />
            <svg viewBox="0 0 160 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative w-36 h-40 drop-shadow-xl">
              {/* Shadow */}
              <ellipse cx="80" cy="175" rx="48" ry="6" fill="#033876" opacity="0.07" />
              {/* Shield body */}
              <path
                d="M80 14 L130 34 L130 82 C130 114 108 138 80 150 C52 138 30 114 30 82 L30 34 Z"
                fill="white"
                stroke="#e5e7eb"
                strokeWidth="1.5"
              />
              {/* Shield inner glow */}
              <path
                d="M80 24 L122 41 L122 82 C122 110 103 132 80 143 C57 132 38 110 38 82 L38 41 Z"
                fill="#fef2f2"
                stroke="none"
              />
              {/* Lock body */}
              <rect x="65" y="80" width="30" height="24" rx="5" fill="#ef4444" opacity="0.85" />
              {/* Lock shackle */}
              <path
                d="M71 80 L71 71 C71 63.3 89 63.3 89 71 L89 80"
                stroke="#ef4444"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
                opacity="0.85"
              />
              {/* Keyhole */}
              <circle cx="80" cy="89" r="4" fill="white" opacity="0.9" />
              <rect x="78" y="91" width="4" height="6" rx="1" fill="white" opacity="0.9" />
              {/* Sparkles */}
              <path d="M18 44 L20 40 L22 44 L18 46Z" fill="#ef9f27" opacity="0.6" />
              <path d="M136 54 L138 50 L140 54 L136 56Z" fill="#1d9e75" opacity="0.6" />
              <circle cx="22" cy="110" r="3" fill="#033876" opacity="0.15" />
              <circle cx="138" cy="100" r="2.5" fill="#ef9f27" opacity="0.35" />
            </svg>
          </div>
        </div>

        {/* 403 number */}
        <div
          className="text-[96px] font-black leading-none tracking-tighter mb-3 select-none"
          style={{
            background: "linear-gradient(135deg, #ef4444 0%, #ef9f27 60%, #033876 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          403
        </div>

        {/* Headline */}
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          {isAuthenticated ? "This feature is locked" : "Sign in to continue"}
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-4 max-w-sm mx-auto">
          {isAuthenticated
            ? `You're on the ${planLabel} plan. This feature requires a higher tier — upgrade to unlock it.`
            : "You need to be signed in to access this page. Sign in or create a free account to continue."}
        </p>

        {/* Current plan pill (shown if authenticated) */}
        {isAuthenticated && (
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm text-xs font-medium text-gray-600">
              <span className={`w-2 h-2 rounded-full ${
                plan === "free" ? "bg-gray-400" :
                plan === "starter" ? "bg-teal-500" :
                plan === "pro" ? "bg-amber-500" : "bg-brand-600"
              }`} />
              Current plan: <span className="font-semibold text-gray-800">{planLabel}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Go back
          </button>

          {isAuthenticated ? (
            <a
              href="/pricing"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition-all"
              style={{ background: "linear-gradient(135deg, #033876, #1d6bbf)" }}
            >
              View plans
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </a>
          ) : (
            <a
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-sm font-semibold text-white hover:bg-brand-800 shadow-sm transition-all"
            >
              Sign in
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </a>
          )}
        </div>

        {/* Brand footer */}
        <p className="mt-12 text-[11px] text-gray-300 tracking-wide">
          SEEVV · Your AI career co-pilot
        </p>
      </div>
    </div>
  );
};

export default Unauthorised;
