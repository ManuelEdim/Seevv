import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signUp, signInWithGoogle } from "@/lib/auth";
import { Button, Input } from "@/components/ui";
import { useToast } from "@/context/ToastContext";

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

const Signup = () => {
  const navigate = useNavigate();
  const [authError, setAuthError] = useState(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { toast } = useToast();

  // NOTE: success state and "Check your email" screen removed
  // Email confirmation is disabled in Supabase for development
  // Users are redirected directly to dashboard after signup
  // Re-enable when deploying to production:
  //   1. Turn on "Confirm email" in Supabase Auth settings
  //   2. Restore the success state and confirmation screen below
  // const [success, setSuccess] = useState(false);

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
      // Previously: setSuccess(true) — showed "Check your email" screen
      // Now: redirect straight to dashboard (email confirmation disabled)
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

  // — EMAIL CONFIRMATION SCREEN (disabled for development) —
  // Restore this block when email confirmation is re-enabled in production:
  //
  // if (success) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
  //       <div className="w-full max-w-md text-center">
  //         <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6">
  //           <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
  //             stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  //             <polyline points="20 6 9 17 4 12" />
  //           </svg>
  //         </div>
  //         <h2 className="text-2xl font-semibold text-gray-900 mb-2">
  //           Check your email
  //         </h2>
  //         <p className="text-gray-400 text-sm mb-8">
  //           We've sent a confirmation link to your email address.
  //           Click the link to activate your account.
  //         </p>
  //         <Button variant="primary" fullWidth onClick={() => navigate("/login")}>
  //           Back to login
  //         </Button>
  //       </div>
  //     </div>
  //   );
  // }

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
            Your CV, perfectly positioned for every role.
          </h2>
          <p className="text-brand-200 text-base leading-relaxed">
            Join thousands of job seekers using Seevv to decode job
            descriptions, tailor their CVs, and land more interviews.
          </p>
        </div>
        <div className="space-y-3">
          {[
            "Deep Decoder — understand what companies actually need",
            "AI CV rewriter that sounds like you",
            "Gap-to-Goal roadmap to close skill gaps",
            "Interview prep tied to your tailored CV",
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-teal-400 flex items-center justify-center flex-shrink-0">
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

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <span className="text-2xl font-semibold text-brand-600">Seevv</span>
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
