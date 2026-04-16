import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn, signInWithGoogle } from "@/lib/auth";
import { Button, Input } from "@/components/ui";
import { useToast } from "@/context/ToastContext";
import { useAuthStore } from "@/store";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

// ─── Left panel illustration ──────────────────────────────

const HeroIllustration = () => (
  <svg
    viewBox="0 0 340 260"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full max-w-sm mx-auto"
    aria-hidden="true"
  >
    {/* Background glow */}
    <ellipse cx="170" cy="140" rx="130" ry="90" fill="rgba(255,255,255,0.04)" />

    {/* Main CV card */}
    <rect
      x="72"
      y="28"
      width="148"
      height="188"
      rx="12"
      fill="rgba(255,255,255,0.12)"
      stroke="rgba(255,255,255,0.25)"
      strokeWidth="1.5"
    />

    {/* Avatar circle */}
    <circle cx="108" cy="62" r="18" fill="rgba(255,255,255,0.2)" />
    <circle cx="108" cy="56" r="7" fill="rgba(255,255,255,0.5)" />
    <ellipse cx="108" cy="72" rx="11" ry="7" fill="rgba(255,255,255,0.3)" />

    {/* Name & role lines */}
    <rect
      x="132"
      y="52"
      width="68"
      height="7"
      rx="3.5"
      fill="rgba(255,255,255,0.7)"
    />
    <rect
      x="132"
      y="65"
      width="50"
      height="5"
      rx="2.5"
      fill="rgba(255,255,255,0.35)"
    />

    {/* Section divider */}
    <line
      x1="88"
      y1="92"
      x2="204"
      y2="92"
      stroke="rgba(255,255,255,0.15)"
      strokeWidth="1"
    />

    {/* Experience text lines */}
    <rect
      x="88"
      y="104"
      width="44"
      height="5"
      rx="2.5"
      fill="rgba(255,255,255,0.5)"
    />
    <rect
      x="88"
      y="116"
      width="112"
      height="4"
      rx="2"
      fill="rgba(255,255,255,0.25)"
    />
    <rect
      x="88"
      y="124"
      width="96"
      height="4"
      rx="2"
      fill="rgba(255,255,255,0.25)"
    />
    <rect
      x="88"
      y="132"
      width="104"
      height="4"
      rx="2"
      fill="rgba(255,255,255,0.25)"
    />

    <line
      x1="88"
      y1="148"
      x2="204"
      y2="148"
      stroke="rgba(255,255,255,0.15)"
      strokeWidth="1"
    />

    <rect
      x="88"
      y="158"
      width="36"
      height="5"
      rx="2.5"
      fill="rgba(255,255,255,0.5)"
    />
    <rect
      x="88"
      y="170"
      width="108"
      height="4"
      rx="2"
      fill="rgba(255,255,255,0.25)"
    />
    <rect
      x="88"
      y="178"
      width="88"
      height="4"
      rx="2"
      fill="rgba(255,255,255,0.25)"
    />
    <rect
      x="88"
      y="186"
      width="100"
      height="4"
      rx="2"
      fill="rgba(255,255,255,0.25)"
    />

    {/* Match score ring — right side floating card */}
    <rect
      x="208"
      y="48"
      width="80"
      height="80"
      rx="14"
      fill="rgba(255,255,255,0.1)"
      stroke="rgba(255,255,255,0.2)"
      strokeWidth="1.5"
    />
    <circle
      cx="248"
      cy="82"
      r="24"
      stroke="rgba(255,255,255,0.2)"
      strokeWidth="4"
      fill="none"
    />
    <circle
      cx="248"
      cy="82"
      r="24"
      stroke="#1d9e75"
      strokeWidth="4"
      fill="none"
      strokeDasharray="133 17"
      strokeLinecap="round"
      transform="rotate(-90 248 82)"
    />
    <text
      x="248"
      y="86"
      fontSize="13"
      fontWeight="700"
      fill="white"
      textAnchor="middle"
      fontFamily="Arial, sans-serif"
    >
      88%
    </text>
    <text
      x="248"
      y="116"
      fontSize="8"
      fill="rgba(255,255,255,0.6)"
      textAnchor="middle"
      fontFamily="Arial, sans-serif"
    >
      Match score
    </text>

    {/* AI badge floating bottom-right of CV */}
    <rect x="152" y="200" width="84" height="26" rx="13" fill="#1d9e75" />
    <text
      x="194"
      y="217"
      fontSize="10"
      fontWeight="600"
      fill="white"
      textAnchor="middle"
      fontFamily="Arial, sans-serif"
    >
      ✦ AI Tailored
    </text>

    {/* Keywords floating chip — top left */}
    <rect
      x="28"
      y="56"
      width="54"
      height="22"
      rx="11"
      fill="rgba(255,255,255,0.12)"
      stroke="rgba(255,255,255,0.2)"
      strokeWidth="1"
    />
    <text
      x="55"
      y="71"
      fontSize="9"
      fill="rgba(255,255,255,0.8)"
      textAnchor="middle"
      fontFamily="Arial, sans-serif"
    >
      ATS Ready
    </text>

    {/* Floating dot accents */}
    <circle cx="42" cy="140" r="4" fill="#ef9f27" opacity="0.7" />
    <circle cx="300" cy="160" r="3" fill="rgba(255,255,255,0.3)" />
    <circle cx="265" cy="28" r="5" fill="rgba(255,255,255,0.15)" />
    <circle cx="56" cy="196" r="3" fill="#1d9e75" opacity="0.5" />

    {/* Sparkle stars */}
    <path d="M36 108 L38 104 L40 108 L36 110 Z" fill="rgba(255,255,255,0.5)" />
    <path d="M296 72 L298 68 L300 72 L296 74 Z" fill="rgba(255,255,255,0.4)" />
    <path
      d="M310 200 L312 196 L314 200 L310 202 Z"
      fill="#ef9f27"
      opacity="0.6"
    />
  </svg>
);

// ─── Login page ───────────────────────────────────────────

const Login = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authError, setAuthError] = useState(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    try {
      setAuthError(null);
      await signIn({ email: data.email, password: data.password });
      toast.success("Welcome back! Redirecting...");
      setTimeout(() => navigate("/dashboard"), 800);
    } catch (error) {
      const message = error.message || "Invalid email or password";
      setAuthError(message);
      toast.error(message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      setAuthError(null);
      toast.info("Redirecting to Google...");
      await signInWithGoogle();
    } catch (error) {
      const message = error.message || "Google sign in failed";
      setAuthError(message);
      toast.error(message);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left panel — branding + illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-600 flex-col justify-between p-12 relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="grid-login"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="white"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-login)" />
          </svg>
        </div>

        <div className="h-16 px-5 border-gray-100 flex items-center justify-between shrink-0">
          <img
            src="/altnewlogo.png"
            alt="Seevv"
            className="lg:h-12 h-12 object-contain cursor-pointer"
          />
          {/* Close button — mobile only */}
        </div>

        {/* Hero illustration */}
        <div className="relative z-10 flex-1 flex items-center justify-center py-8">
          <HeroIllustration />
        </div>

        <div className="relative z-10">
          <h2 className="text-3xl font-semibold text-white leading-snug mb-3">
            Get hired, not just apply.
          </h2>
          <p className="text-brand-200 text-sm leading-relaxed mb-6">
            AI-powered CV tailoring that understands what companies actually
            need — and positions you perfectly for every role.
          </p>
          <div className="flex gap-3">
            <div className="bg-brand-800/60 backdrop-blur-sm rounded-xl px-4 py-3 border border-brand-700/50 border-amber-50">
              <p className="text-white text-sm font-bold">88%</p>
              <p className="text-brand-300 text-white text-xs mt-0.5">
                Avg. match score
              </p>
            </div>
            <div className="bg-brand-800/60 backdrop-blur-sm rounded-xl px-4 py-3 border border-brand-700/50  border-amber-50">
              <p className="text-white text-sm font-bold">3×</p>
              <p className="text-brand-300 text-white text-xs mt-0.5">
                More interviews
              </p>
            </div>
            <div className="bg-brand-800/60  border-amber-50 backdrop-blur-sm rounded-xl px-4 py-3 border border-brand-700/50">
              <p className="text-white text-sm font-bold">5 min</p>
              <p className="text-brand-300 text-white text-xs mt-0.5">
                Per application
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="h-16 px-5 flex items-center justify-between shrink-0 lg:hidden mb-8">
            <img
              src="/logo.png"
              alt="Seevv"
              className="lg:h-12 h-12 w-full object-contain cursor-pointer"
            />
            {/* Close button — mobile only */}
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            Welcome back
          </h1>
          <p className="text-gray-400 text-sm mb-8">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-brand-600 hover:text-brand-800 font-medium"
            >
              Sign up free
            </Link>
          </p>

          {/* Google OAuth button */}
          <Button
            variant="outline"
            fullWidth
            isLoading={googleLoading}
            onClick={handleGoogleLogin}
            className="mb-4"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">
              or continue with email
            </span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Error message */}
          {authError && (
            <div className="mb-4 px-4 py-3 bg-coral-50 border border-coral-400 rounded-lg">
              <p className="text-sm text-coral-700">{authError}</p>
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register("email")}
            />
            <div>
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register("password")}
              />
              <div className="mt-1.5 text-right">
                <Link
                  to="/forgot-password"
                  className="text-xs text-brand-600 hover:text-brand-800"
                >
                  Forgot password?
                </Link>
              </div>
            </div>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isSubmitting}
              className="mt-2"
            >
              Sign in
            </Button>
          </form>

          <p className="mt-8 text-xs text-gray-400 text-center">
            By continuing, you agree to Seevv's{" "}
            <span className="text-brand-600 cursor-pointer">
              Terms of Service
            </span>{" "}
            and{" "}
            <span className="text-brand-600 cursor-pointer">
              Privacy Policy
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
