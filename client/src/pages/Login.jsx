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

const Login = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authError, setAuthError] = useState(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Redirect to dashboard if already authenticated
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
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-600 flex-col justify-between p-12">
        <div>
          <span className="text-2xl font-semibold text-white tracking-tight">
            Seevv
          </span>
        </div>
        <div>
          <h2 className="text-3xl font-semibold text-white leading-snug mb-4">
            Get hired, not just apply.
          </h2>
          <p className="text-brand-200 text-base leading-relaxed">
            AI-powered CV tailoring that understands what companies actually
            need — and positions you perfectly for every role.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-brand-800 rounded-lg px-4 py-3">
            <p className="text-white text-sm font-medium">88%</p>
            <p className="text-brand-200 text-xs">Avg. match score</p>
          </div>
          <div className="bg-brand-800 rounded-lg px-4 py-3">
            <p className="text-white text-sm font-medium">3x</p>
            <p className="text-brand-200 text-xs">More interviews</p>
          </div>
          <div className="bg-brand-800 rounded-lg px-4 py-3">
            <p className="text-white text-sm font-medium">5 min</p>
            <p className="text-brand-200 text-xs">Per application</p>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <span className="text-2xl font-semibold text-brand-600">Seevv</span>
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
