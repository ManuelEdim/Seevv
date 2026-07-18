import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { Button, Input } from "@/components/ui";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email"),
});

const ForgotPassword = () => {
  const [sent, setSent] = useState(false);
  const [sentTo, setSentTo] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async ({ email }) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });
    if (error) throw error;
    setSentTo(email);
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src="/logo.png" alt="Seevv" className="h-9 object-contain" />
        </div>

        {sent ? (
          /* ── Success state ── */
          <div className="text-center">
            <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Check your inbox</h1>
            <p className="text-sm text-gray-400 leading-relaxed mb-1">
              We sent a password reset link to
            </p>
            <p className="text-sm font-semibold text-gray-700 mb-6">{sentTo}</p>
            <p className="text-xs text-gray-400 mb-8">
              The link expires in 1 hour. If you don't see it, check your spam folder.
            </p>
            <Link to="/login" className="text-sm text-brand-600 hover:text-brand-800 font-medium">
              ← Back to sign in
            </Link>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            <h1 className="text-xl font-semibold text-gray-900 mb-1">Forgot your password?</h1>
            <p className="text-sm text-gray-400 mb-8">
              Enter your email and we'll send you a reset link.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                error={errors.email?.message}
                {...register("email")}
              />
              <Button type="submit" variant="primary" fullWidth isLoading={isSubmitting}>
                Send reset link
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-400">
              Remember your password?{" "}
              <Link to="/login" className="text-brand-600 hover:text-brand-800 font-medium">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
