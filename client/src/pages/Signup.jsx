import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signUp, signInWithGoogle } from "@/lib/auth";
import { Button, Input } from "@/components/ui";
import { useToast } from "@/context/ToastContext";
import { useAuthStore } from "@/store";

const signupSchema = z
  .object({
    fullName: z
      .string()
      .min(1, "Full name is required")
      .min(2, "Name must be at least 2 characters"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email"),
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain uppercase, lowercase, and a number",
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ─── Left panel illustration ──────────────────────────────

const JourneyIllustration = () => (
  <svg
    viewBox="0 0 340 240"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full max-w-sm mx-auto"
    aria-hidden="true"
  >
    {/* Connecting path (dashed curve) */}
    <path
      d="M 60 190 C 80 190 100 120 170 120 C 240 120 260 56 290 56"
      stroke="rgba(255,255,255,0.25)"
      strokeWidth="2"
      strokeDasharray="6 5"
      strokeLinecap="round"
    />

    {/* Step 1 — Upload CV (bottom left) */}
    <rect
      x="24"
      y="162"
      width="72"
      height="60"
      rx="12"
      fill="rgba(255,255,255,0.12)"
      stroke="rgba(255,255,255,0.25)"
      strokeWidth="1.5"
    />
    <rect
      x="36"
      y="174"
      width="48"
      height="5"
      rx="2.5"
      fill="rgba(255,255,255,0.6)"
    />
    <rect
      x="36"
      y="184"
      width="40"
      height="3.5"
      rx="1.75"
      fill="rgba(255,255,255,0.3)"
    />
    <rect
      x="36"
      y="192"
      width="44"
      height="3.5"
      rx="1.75"
      fill="rgba(255,255,255,0.3)"
    />
    <rect
      x="36"
      y="200"
      width="36"
      height="3.5"
      rx="1.75"
      fill="rgba(255,255,255,0.3)"
    />
    {/* Step number */}
    <circle
      cx="36"
      cy="170"
      r="8"
      fill="rgba(255,255,255,0.15)"
      stroke="rgba(255,255,255,0.3)"
      strokeWidth="1"
    />
    <text
      x="36"
      y="174"
      fontSize="8"
      fontWeight="700"
      fill="white"
      textAnchor="middle"
      fontFamily="Arial, sans-serif"
    >
      1
    </text>
    <text
      x="60"
      y="236"
      fontSize="8"
      fill="rgba(255,255,255,0.6)"
      textAnchor="middle"
      fontFamily="Arial, sans-serif"
    >
      Upload CV
    </text>

    {/* Step 2 — Decode (middle) */}
    <rect
      x="134"
      y="96"
      width="72"
      height="60"
      rx="12"
      fill="rgba(255,255,255,0.14)"
      stroke="rgba(255,255,255,0.3)"
      strokeWidth="1.5"
    />
    {/* Search icon inside */}
    <circle
      cx="166"
      cy="122"
      r="11"
      stroke="rgba(255,255,255,0.6)"
      strokeWidth="2"
      fill="none"
    />
    <line
      x1="174"
      y1="130"
      x2="180"
      y2="136"
      stroke="rgba(255,255,255,0.6)"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="166" cy="122" r="5" fill="rgba(255,255,255,0.2)" />
    <circle
      cx="146"
      cy="102"
      r="8"
      fill="rgba(255,255,255,0.15)"
      stroke="rgba(255,255,255,0.35)"
      strokeWidth="1"
    />
    <text
      x="146"
      y="106"
      fontSize="8"
      fontWeight="700"
      fill="white"
      textAnchor="middle"
      fontFamily="Arial, sans-serif"
    >
      2
    </text>
    <text
      x="170"
      y="172"
      fontSize="8"
      fill="rgba(255,255,255,0.6)"
      textAnchor="middle"
      fontFamily="Arial, sans-serif"
    >
      Decode JD
    </text>

    {/* Step 3 — Tailored CV (top right) */}
    <rect
      x="252"
      y="28"
      width="72"
      height="72"
      rx="12"
      fill="rgba(255,255,255,0.18)"
      stroke="rgba(255,255,255,0.35)"
      strokeWidth="1.5"
    />
    {/* Checkmark + sparkle */}
    <circle
      cx="288"
      cy="60"
      r="16"
      fill="rgba(29, 158, 117, 0.25)"
      stroke="#1d9e75"
      strokeWidth="1.5"
    />
    <path
      d="M280 60 L286 66 L298 52"
      stroke="#1d9e75"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      cx="262"
      cy="34"
      r="8"
      fill="rgba(255,255,255,0.15)"
      stroke="rgba(255,255,255,0.35)"
      strokeWidth="1"
    />
    <text
      x="262"
      y="38"
      fontSize="8"
      fontWeight="700"
      fill="white"
      textAnchor="middle"
      fontFamily="Arial, sans-serif"
    >
      3
    </text>
    <text
      x="288"
      y="112"
      fontSize="8"
      fill="rgba(255,255,255,0.6)"
      textAnchor="middle"
      fontFamily="Arial, sans-serif"
    >
      Apply!
    </text>

    {/* "AI" label floating beside step 2 */}
    <rect
      x="204"
      y="108"
      width="38"
      height="20"
      rx="10"
      fill="#ef9f27"
      opacity="0.85"
    />
    <text
      x="223"
      y="122"
      fontSize="9"
      fontWeight="600"
      fill="white"
      textAnchor="middle"
      fontFamily="Arial, sans-serif"
    >
      ✦ AI
    </text>

    {/* Decorative dots */}
    <circle cx="110" cy="150" r="3.5" fill="rgba(255,255,255,0.3)" />
    <circle cx="232" cy="88" r="3.5" fill="rgba(255,255,255,0.3)" />
    <circle cx="26" cy="136" r="3" fill="#ef9f27" opacity="0.5" />
    <circle cx="320" cy="140" r="4" fill="rgba(255,255,255,0.15)" />

    {/* Sparkles */}
    <path d="M112 64 L114 60 L116 64 L112 66 Z" fill="rgba(255,255,255,0.5)" />
    <path d="M22 80 L24 76 L26 80 L22 82 Z" fill="rgba(255,255,255,0.35)" />
    <path
      d="M310 180 L312 176 L314 180 L310 182 Z"
      fill="#1d9e75"
      opacity="0.6"
    />
  </svg>
);

// ─── Signup page ──────────────────────────────────────────

const Signup = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();
  const [authError, setAuthError] = useState(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { toast } = useToast();

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
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data) => {
    try {
      setAuthError(null);
      await signUp({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
      });
      toast.success("Account created! Welcome to Seevv.");
      setTimeout(() => navigate("/dashboard"), 800);
    } catch (error) {
      const message =
        error.message || "Something went wrong. Please try again.";
      setAuthError(message);
      toast.error(message);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setGoogleLoading(true);
      setAuthError(null);
      toast.info("Redirecting to Google...");
      await signInWithGoogle();
    } catch (error) {
      const message = error.message || "Google sign up failed";
      setAuthError(message);
      toast.error(message);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left panel — branding + illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-600 flex-col justify-between p-12 relative overflow-hidden">
        {/* Subtle background grid */}
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="grid-signup"
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
            <rect width="100%" height="100%" fill="url(#grid-signup)" />
          </svg>
        </div>

        {/* <div className="relative z-10">
          <span className="text-2xl font-semibold text-white tracking-tight">
            Seevv
          </span>
        </div> */}

        <div className="h-16 px-5 border-gray-100 flex items-center justify-between shrink-0">
          <img
            src="/altnewlogo.png"
            alt="Seevv"
            className="lg:h-12 h-12 object-contain cursor-pointer"
          />
          {/* Close button — mobile only */}
        </div>

        {/* Journey illustration */}
        <div className="relative z-10 flex-1 flex items-center justify-center py-6">
          <JourneyIllustration />
        </div>

        <div className="relative z-10">
          <h2 className="text-3xl font-semibold text-white leading-snug mb-3">
            Your CV, perfectly positioned for every role.
          </h2>
          <p className="text-brand-200 text-sm leading-relaxed mb-6">
            Join thousands of job seekers using Seevv to decode job
            descriptions, tailor their CVs, and land more interviews.
          </p>
          <div className="space-y-2.5">
            {[
              "Deep Decoder — understand what companies actually need",
              "AI CV rewriter that sounds like you",
              "Voice-matched cover letters in minutes",
              "Export a polished PDF, ready to send",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-teal-400/80 flex items-center justify-center shrink-0">
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="text-brand-100 text-sm">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Mobile logo */}
          {/* <div className="lg:hidden mb-8">
            <span className="text-2xl font-semibold text-brand-600">Seevv</span>
          </div> */}
          {/* Brand + close button */}
          <div className="h-16 px-5 flex items-center justify-between shrink-0 lg:hidden mb-8">
            <img
              src="/logo.png"
              alt="Seevv"
              className="lg:h-12 h-12 w-full object-contain cursor-pointer"
            />
            {/* Close button — mobile only */}
          </div>

          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            Create your account
          </h1>
          <p className="text-gray-400 text-sm mb-8">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-brand-600 hover:text-brand-800 font-medium"
            >
              Sign in
            </Link>
          </p>

          {/* Google OAuth button */}
          <Button
            variant="outline"
            fullWidth
            isLoading={googleLoading}
            onClick={handleGoogleSignup}
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
            <span className="text-xs text-gray-400">or sign up with email</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Error message */}
          {authError && (
            <div className="mb-4 px-4 py-3 bg-coral-50 border border-coral-400 rounded-lg">
              <p className="text-sm text-coral-700">{authError}</p>
            </div>
          )}

          {/* Signup form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full name"
              type="text"
              placeholder="James Adeyemi"
              error={errors.fullName?.message}
              {...register("fullName")}
            />
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register("email")}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              hint="Min 8 characters with uppercase, lowercase, and a number"
              error={errors.password?.message}
              {...register("password")}
            />
            <Input
              label="Confirm password"
              type="password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />
            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isSubmitting}
              className="mt-2"
            >
              Create account
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

export default Signup;
