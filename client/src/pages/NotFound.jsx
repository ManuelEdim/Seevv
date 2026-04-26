import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store";

const NotFound = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden bg-[#f8f9fc]">

      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-120px] right-[-80px] w-[480px] h-[480px] rounded-full bg-brand-100 opacity-40 blur-[100px]" />
        <div className="absolute bottom-[-100px] left-[-60px] w-[400px] h-[400px] rounded-full bg-teal-100 opacity-30 blur-[90px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-brand-50 opacity-50 blur-[120px]" />
      </div>

      {/* Subtle dot grid */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #033876 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          opacity: 0.04,
        }}
      />

      <div className="relative z-10 text-center max-w-lg w-full">

        {/* Floating document illustration */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            {/* Glow */}
            <div className="absolute inset-0 blur-2xl bg-brand-300 opacity-25 rounded-full scale-150" />
            <svg viewBox="0 0 160 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative w-36 h-40 drop-shadow-xl">
              {/* Shadow */}
              <ellipse cx="80" cy="175" rx="50" ry="6" fill="#033876" opacity="0.08" />
              {/* Document body */}
              <rect x="20" y="10" width="100" height="130" rx="12" fill="white" stroke="#e5e7eb" strokeWidth="1.5" />
              {/* Folded corner */}
              <path d="M96 10 L120 34 L96 34 Z" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1.5" strokeLinejoin="round" />
              {/* Lines */}
              <rect x="34" y="50" width="72" height="5" rx="2.5" fill="#e5e7eb" />
              <rect x="34" y="62" width="56" height="4" rx="2" fill="#e5e7eb" />
              <rect x="34" y="73" width="64" height="4" rx="2" fill="#e5e7eb" />
              <rect x="34" y="84" width="48" height="4" rx="2" fill="#e5e7eb" />
              {/* Question mark circle */}
              <circle cx="80" cy="110" r="22" fill="#033876" />
              <text x="80" y="118" textAnchor="middle" fontSize="22" fontWeight="800" fill="white" fontFamily="Arial,sans-serif">?</text>
              {/* Sparkles */}
              <path d="M22 22 L24 18 L26 22 L22 24Z" fill="#ef9f27" opacity="0.7" />
              <path d="M136 48 L138 44 L140 48 L136 50Z" fill="#1d9e75" opacity="0.7" />
              <circle cx="16" cy="100" r="3" fill="#033876" opacity="0.2" />
              <circle cx="144" cy="90" r="2.5" fill="#ef9f27" opacity="0.4" />
            </svg>
          </div>
        </div>

        {/* 404 number */}
        <div
          className="text-[96px] font-black leading-none tracking-tighter mb-3 select-none"
          style={{
            background: "linear-gradient(135deg, #033876 0%, #1d6bbf 50%, #1d9e75 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          404
        </div>

        {/* Headline */}
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          This page is off the market
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-10 max-w-sm mx-auto">
          The page you're looking for doesn't exist, was moved, or you may have followed a broken link.
        </p>

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
          <Link
            to={isAuthenticated ? "/dashboard" : "/"}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-sm font-semibold text-white hover:bg-brand-800 shadow-sm transition-all"
          >
            {isAuthenticated ? "Back to Dashboard" : "Go to Home"}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </Link>
        </div>

        {/* Brand footer */}
        <p className="mt-12 text-[11px] text-gray-300 tracking-wide">
          SEEVV · Your AI career co-pilot
        </p>
      </div>
    </div>
  );
};

export default NotFound;
