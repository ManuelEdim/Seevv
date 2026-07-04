import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signUp, signInWithGoogle } from "@/lib/auth";
import { Button, Input } from "@/components/ui";
import { useToast } from "@/context/ToastContext";
import { useAuthStore } from "@/store";
import { supabase } from "@/lib/supabase";

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

// ─── Role selector ────────────────────────────────────────
const RoleCard = ({ value, selected, onSelect, icon, title, desc }) => (
  <button
    type="button"
    onClick={() => onSelect(value)}
    className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer text-center ${
      selected
        ? "border-brand-600 bg-brand-50"
        : "border-gray-200 hover:border-gray-300 bg-white"
    }`}
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selected ? "bg-brand-600" : "bg-gray-100"}`}>
      {icon(selected)}
    </div>
    <div>
      <p className={`text-xs font-bold ${selected ? "text-brand-700" : "text-gray-700"}`}>{title}</p>
      <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">{desc}</p>
    </div>
  </button>
);

// ─── Persona pills (shown on left panel) ─────────────────

const PERSONAS = [
  { label: "Engineer", bg: "bg-amber-400/20", text: "text-amber-200", icon: "⚙️" },
  { label: "Designer", bg: "bg-purple-400/20", text: "text-purple-200", icon: "🎨" },
  { label: "Doctor", bg: "bg-teal-400/20", text: "text-teal-200", icon: "🩺" },
  { label: "Student", bg: "bg-brand-400/20", text: "text-brand-200", icon: "🎓" },
  { label: "Product", bg: "bg-pink-400/20", text: "text-pink-200", icon: "📱" },
  { label: "Finance", bg: "bg-green-400/20", text: "text-green-200", icon: "📊" },
  { label: "Sales", bg: "bg-orange-400/20", text: "text-orange-200", icon: "🤝" },
  { label: "Teacher", bg: "bg-red-400/20", text: "text-red-200", icon: "📚" },
];

// ─── Signup page ──────────────────────────────────────────

const Signup = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();
  const [authError, setAuthError] = useState(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [role, setRole] = useState("user");
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
      const result = await signUp({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        role,
      });
      if (result?.user?.id) {
        await supabase.from("profiles").upsert({
          id: result.user.id,
          email: data.email,
          full_name: data.fullName,
          role,
          plan: "free",
        });
      }
      toast.success("Account created! Welcome to Seevv.");
      // Fire-and-forget welcome email — don't block navigation on it
      api.post("/auth/welcome").catch(() => {});
      setTimeout(() => navigate(role === "recruiter" ? "/recruiter" : "/dashboard"), 800);
    } catch (error) {
      const message = error.message || "Something went wrong. Please try again.";
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

      {/* Left panel — diverse career photo */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col">
        {/* Photo — the 4 diverse professionals */}
        <img
          src="/img1.jpg"
          alt="Diverse professionals"
          className="absolute inset-0 w-full h-full object-cover object-top"
        />
        {/* Dark overlay — heavier at bottom */}
        <div className="absolute inset-0 bg-linear-to-b from-brand-900/65 via-brand-900/70 to-brand-900/98" />

        {/* Logo */}
        <div className="relative z-10 p-10 shrink-0">
          <img src="/altnewlogo.png" alt="Seevv" className="h-10 object-contain" />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Who it's for — persona pills */}
        <div className="relative z-10 px-10 pb-6">
          <p className="text-white/50 text-[11px] font-semibold uppercase tracking-widest mb-3">
            Built for every career path
          </p>
          <div className="flex flex-wrap gap-2 mb-8">
            {PERSONAS.map((p) => (
              <span
                key={p.label}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${p.bg} ${p.text} border border-white/10`}
              >
                {p.icon} {p.label}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom copy */}
        <div className="relative z-10 px-10 pb-10">
          <h2 className="text-2xl font-bold text-white leading-snug mb-3">
            Your CV, perfectly positioned for every role.
          </h2>
          <p className="text-white/60 text-sm leading-relaxed mb-5">
            Join thousands of job seekers using Seevv to decode job descriptions,
            tailor their CVs, and land more interviews.
          </p>
          <div className="space-y-2">
            {[
              "Deep Decoder — understand what companies actually need",
              "AI CV rewriter that sounds like you",
              "Voice-matched cover letters in minutes",
              "Export a polished PDF, ready to send",
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-teal-400/80 flex items-center justify-center shrink-0">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="text-white/80 text-xs">{feat}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Mobile logo */}
          <div className="h-16 flex items-center shrink-0 lg:hidden mb-8">
            <img src="/logo.png" alt="Seevv" className="h-10 object-contain" />
          </div>

          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            Create your account
          </h1>
          <p className="text-gray-400 text-sm mb-8">
            Already have an account?{" "}
            <Link to="/login" className="text-brand-600 hover:text-brand-800 font-medium">
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
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">I am joining as a…</p>
              <div className="flex gap-3">
                <RoleCard
                  value="user"
                  selected={role === "user"}
                  onSelect={setRole}
                  title="Job Seeker"
                  desc="Tailoring CVs & landing interviews"
                  icon={(sel) => (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={sel ? "white" : "#6b7280"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                  )}
                />
                <RoleCard
                  value="recruiter"
                  selected={role === "recruiter"}
                  onSelect={setRole}
                  title="Recruiter"
                  desc="Discovering & ranking candidates"
                  icon={(sel) => (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={sel ? "white" : "#6b7280"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  )}
                />
              </div>
            </div>

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
            <span className="text-brand-600 cursor-pointer">Terms of Service</span>{" "}
            and{" "}
            <span className="text-brand-600 cursor-pointer">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
