import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Badge } from "@/components/ui";
import { useToast } from "@/context/ToastContext";
import { useAuthStore } from "@/store";

// ─── Plan definitions ──────────────────────────────────────

const plans = [
  {
    id: "free",
    name: "Free",
    price: { monthly: 0, annual: 0 },
    badge: null,
    description: "Get started and explore the core features.",
    color: "border-gray-200",
    highlight: false,
    cta: "Current plan",
    ctaVariant: "outline",
    features: [
      "1 active CV",
      "3 job targets",
      "Deep Decoder (3 runs/month)",
      "CV tailoring (3 versions)",
      "Cover letter (3/month)",
      "PDF export",
    ],
    missing: [
      "Gap-to-Goal Roadmap",
      "Company Intelligence Panel",
      "Industry Transition Mode",
      "Speed Mode (bulk scoring)",
      "Voice mirroring",
      "Interview Prep",
      "Mock Interview",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    price: { monthly: 9, annual: 7 },
    badge: null,
    description: "For active job seekers targeting multiple roles.",
    color: "border-brand-200",
    highlight: false,
    cta: "Upgrade to Starter",
    ctaVariant: "outline",
    features: [
      "3 active CVs",
      "15 job targets",
      "Deep Decoder (unlimited)",
      "CV tailoring (15 versions)",
      "Cover letter (unlimited)",
      "PDF export",
      "Voice mirroring",
      "Gap-to-Goal Roadmap",
      "Company Intelligence Panel",
    ],
    missing: [
      "Industry Transition Mode",
      "Speed Mode (bulk scoring)",
      "Interview Prep + Mock Interview",
      "Application Analytics",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: { monthly: 19, annual: 15 },
    badge: "Most popular",
    description: "Full intelligence layer for serious job seekers.",
    color: "border-brand-600",
    highlight: true,
    cta: "Upgrade to Pro",
    ctaVariant: "primary",
    features: [
      "Unlimited CVs",
      "Unlimited job targets",
      "Everything in Starter",
      "Industry Transition Mode",
      "Speed Mode — bulk score 10 jobs at once",
      "Interview Prep (full prep sheet)",
      "Mock Interview with confidence scoring",
      "Application Analytics dashboard",
      "Priority AI (faster responses)",
    ],
    missing: [],
  },
  {
    id: "pro_plus",
    name: "Pro+",
    price: { monthly: 39, annual: 29 },
    badge: "Teams & power users",
    description: "For professionals who apply at scale or want the edge.",
    color: "border-amber-400",
    highlight: false,
    cta: "Upgrade to Pro+",
    ctaVariant: "outline",
    features: [
      "Everything in Pro",
      "Verification badge (LinkedIn sync)",
      "Recruiter-mode profile",
      "Early access to V3+ features",
      "Dedicated support",
      "Custom branding on exports",
      "API access (beta)",
    ],
    missing: [],
  },
];

// ─── Check icon ────────────────────────────────────────────
const Check = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-teal-500 shrink-0 mt-0.5">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const Cross = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 shrink-0 mt-0.5">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ─── Plan card ─────────────────────────────────────────────
const PlanCard = ({ plan, isCurrentPlan, billing, onSelect }) => (
  <div className={`relative bg-white rounded-2xl border-2 ${plan.color} ${plan.highlight ? "shadow-2xl scale-[1.02]" : "shadow-card"} flex flex-col transition-all duration-200 hover:shadow-xl`}>
    {plan.badge && (
      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
        <span className={`text-xs font-bold px-3 py-1 rounded-full text-white ${plan.highlight ? "bg-brand-600" : "bg-amber-400"}`}>
          {plan.badge}
        </span>
      </div>
    )}

    <div className="p-6 flex-1">
      <div className="mb-4">
        <h3 className="text-base font-bold text-gray-900">{plan.name}</h3>
        <p className="text-xs text-gray-400 mt-0.5">{plan.description}</p>
      </div>

      <div className="mb-5">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-gray-900">
            ${billing === "annual" ? plan.price.annual : plan.price.monthly}
          </span>
          <span className="text-sm text-gray-400">/mo</span>
        </div>
        {billing === "annual" && plan.price.monthly > 0 && (
          <p className="text-xs text-teal-600 font-medium mt-0.5">
            Billed annually · saves ${(plan.price.monthly - plan.price.annual) * 12}/yr
          </p>
        )}
        {plan.price.monthly === 0 && (
          <p className="text-xs text-gray-400 mt-0.5">Free forever</p>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-2 mb-5">
        {plan.features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
            <Check />
            {f}
          </li>
        ))}
        {plan.missing.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
            <Cross />
            {f}
          </li>
        ))}
      </ul>
    </div>

    <div className="px-6 pb-6">
      <Button
        variant={isCurrentPlan ? "outline" : plan.ctaVariant}
        fullWidth
        disabled={isCurrentPlan}
        onClick={() => !isCurrentPlan && onSelect(plan.id)}
      >
        {isCurrentPlan ? "Current plan" : plan.cta}
      </Button>
    </div>
  </div>
);

// ─── Pricing page ──────────────────────────────────────────
const Pricing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);
  const [billing, setBilling] = useState("monthly");

  // For now current plan is always "free" — wire to profile.plan when billing is live
  const currentPlan = "free";

  const handleSelect = (planId) => {
    // Placeholder — wire to Stripe/Paystack when ready
    toast.info(`Billing integration coming soon. Selected: ${planId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer text-gray-500"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <div>
          <h1 className="text-sm font-bold text-gray-900">Upgrade your plan</h1>
          <p className="text-xs text-gray-400">Unlock the full Seevv intelligence layer</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 lg:px-6 pt-10">
        {/* Billing toggle */}
        <div className="flex flex-col items-center mb-10">
          <div className="inline-flex items-center bg-gray-100 rounded-full p-1 gap-1">
            <button
              onClick={() => setBilling("monthly")}
              className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                billing === "monthly" ? "bg-white text-gray-900 shadow-card" : "text-gray-500"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("annual")}
              className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                billing === "annual" ? "bg-white text-gray-900 shadow-card" : "text-gray-500"
              }`}
            >
              Annual
              <span className="ml-1.5 text-teal-600">-25%</span>
            </button>
          </div>
          {billing === "annual" && (
            <p className="text-xs text-teal-700 mt-2 font-medium">
              You save up to $120/year with annual billing
            </p>
          )}
        </div>

        {/* Plan grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 items-start">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrentPlan={currentPlan === plan.id}
              billing={billing}
              onSelect={handleSelect}
            />
          ))}
        </div>

        {/* Trust bar */}
        <div className="mt-12 flex flex-wrap justify-center items-center gap-6 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Cancel anytime
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            7-day money-back guarantee
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
            Instant access on upgrade
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            No data sold, ever
          </span>
        </div>

        {/* FAQ */}
        <div className="mt-14 max-w-2xl mx-auto">
          <h2 className="text-base font-bold text-gray-900 mb-5 text-center">Common questions</h2>
          <div className="space-y-3">
            {[
              {
                q: "Can I downgrade?",
                a: "Yes. You can switch to a lower plan at any time. Your data is always preserved.",
              },
              {
                q: "Will my tailored CVs be deleted if I downgrade?",
                a: "No. All versions you created stay saved. You just won't be able to create new ones beyond your plan limit.",
              },
              {
                q: "Is there a free trial for Pro?",
                a: "The Free plan lets you test core features. When billing goes live, Pro will include a 7-day trial.",
              },
              {
                q: "What payment methods are accepted?",
                a: "Card (Visa, Mastercard), and local Nigerian payment methods (coming soon via Paystack).",
              },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-sm font-semibold text-gray-900 mb-1">{item.q}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
