import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store";
import { Spinner } from "@/components/ui";

const steps = [
  "Verifying your account...",
  "Setting up your workspace...",
  "Almost there...",
];

const AuthCallback = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Cycle through feedback messages
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1000);

    const handleCallback = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;

        if (session) {
          login(session.user, session);
          clearInterval(interval);
          navigate("/dashboard", { replace: true });
        } else {
          // No session — check for error in URL hash
          const hashParams = new URLSearchParams(
            window.location.hash.substring(1),
          );
          const errorDescription = hashParams.get("error_description");

          if (errorDescription) {
            throw new Error(errorDescription);
          }

          navigate("/login", { replace: true });
        }
      } catch (err) {
        clearInterval(interval);
        setError(err.message || "Something went wrong. Please try again.");
      }
    };

    handleCallback();

    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-6 p-8">
        <div className="w-16 h-16 bg-coral-50 rounded-full flex items-center justify-center">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#D85A30"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Sign in failed
          </h2>
          <p className="text-sm text-gray-400 mb-6 max-w-sm">{error}</p>
          <button
            onClick={() => navigate("/login", { replace: true })}
            className="px-6 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-800 transition-colors"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-6">
      {/* Animated logo */}
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center">
          <span className="text-2xl font-semibold text-white">S</span>
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-card">
          <Spinner size="sm" />
        </div>
      </div>

      {/* Step feedback */}
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700 mb-1">
          {steps[stepIndex]}
        </p>
        <p className="text-xs text-gray-400">This only takes a moment</p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i <= stepIndex ? "w-4 bg-brand-600" : "w-1.5 bg-gray-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default AuthCallback;
