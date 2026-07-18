import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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

// ─── Login page ───────────────────────────────────────────

const Login = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [authError, setAuthError] = useState(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (searchParams.get("reason") === "timeout") {
      toast.warning("Your session expired due to inactivity. Please sign in again.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      {/* Left panel — full photo with overlay */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col">
        {/* Photo */}
        <img
          src="/img4.jpg"
          alt="Confident professional"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Gradient — light at top, heavy at bottom for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-brand-900/20 via-brand-900/55 to-brand-900/97" />

        {/* Logo */}
        <div className="relative z-10 p-10 shrink-0">
          <img src="/altnewlogo.png" alt="Seevv" className="h-10 object-contain" />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom copy */}
        <div className="relative z-10 p-10">
          {/* Quote */}
          <div className="mb-6 pl-4 border-l-2 border-teal-400">
            <p className="text-white text-base font-medium leading-relaxed italic">
              "I went from 2 callbacks in 3 months to 4 interviews in 2 weeks.
              Seevv decoded exactly what each role needed."
            </p>
            <p className="text-white/50 text-xs mt-2">— Adaeze O., Product Manager</p>
          </div>

          <h2 className="text-2xl font-bold text-white leading-snug mb-2">
            Get hired, not just apply.
          </h2>
          <p className="text-white/60 text-sm leading-relaxed mb-6">
            AI-powered CV tailoring that understands what companies actually need.
          </p>

          {/* Stats */}
          <div className="flex gap-3">
            {[
              { v: "88%", l: "Avg. match score" },
              { v: "3×", l: "More interviews" },
              { v: "5 min", l: "Per application" },
            ].map((s) => (
              <div key={s.l} className="flex-1 bg-white/10 backdrop-blur-md rounded-xl px-3 py-3 border border-white/15">
                <p className="text-white text-sm font-bold">{s.v}</p>
                <p className="text-white/55 text-[11px] mt-0.5 leading-tight">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="h-16 flex items-center shrink-0 lg:hidden mb-8">
            <img src="/logo.png" alt="Seevv" className="h-10 object-contain" />
          </div>

          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            Welcome back
          </h1>
          <p className="text-gray-400 text-sm mb-8">
            Don't have an account?{" "}
            <Link to="/signup" className="text-brand-600 hover:text-brand-800 font-medium">
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
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or continue with email</span>
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
                <Link to="/forgot-password" className="text-xs text-brand-600 hover:text-brand-800">
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
            <Link to="/terms" className="text-brand-600 hover:text-brand-800">Terms of Service</Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-brand-600 hover:text-brand-800">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
