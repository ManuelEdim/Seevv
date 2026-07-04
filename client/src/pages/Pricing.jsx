import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui";
import { useToast } from "@/context/ToastContext";
import useAuthStore from "@/store/authStore";
import api from "@/lib/api";


// ─── Currency config ───────────────────────────────────────
const currencies = [
  { code: "USD", symbol: "$", label: "USD" },
  { code: "GBP", symbol: "£", label: "GBP" },
  { code: "NGN", symbol: "₦", label: "NGN" },
];

// Prices per plan per currency (monthly USD base; NGN fixed; GBP converted)
const PRICE_MAP = {
  starter: { USD: 9,  GBP: 7,  NGN: 4000  },
  pro:     { USD: 19, GBP: 15, NGN: 9000  },
  pro_plus:{ USD: 39, GBP: 29, NGN: 18000 },
};

// Maps planId + currency to the backend plan key
const PLAN_KEY = {
  starter: { USD: "starter_usd", GBP: "starter_gbp", NGN: "starter_ngn" },
  pro:     { USD: "pro_usd",     GBP: "pro_gbp",     NGN: "pro_ngn"     },
  pro_plus:{ USD: "pro_plus_usd",GBP: "pro_plus_gbp",NGN: "pro_plus_ngn"},
};

const formatPrice = (planId, currencyCode, billing) => {
  const base = PRICE_MAP[planId];
  if (!base) return "Free";
  const sym = currencies.find((c) => c.code === currencyCode)?.symbol || "$";
  const price = billing === "annual"
    ? Math.round(base[currencyCode] * 0.75)
    : base[currencyCode];
  if (currencyCode === "NGN") return `${sym}${price.toLocaleString()}`;
  return `${sym}${price}`;
};

const formatOriginalPrice = (planId, currencyCode) => {
  const base = PRICE_MAP[planId];
  if (!base) return null;
  const sym = currencies.find((c) => c.code === currencyCode)?.symbol || "$";
  if (currencyCode === "NGN") return `${sym}${base[currencyCode].toLocaleString()}`;
  return `${sym}${base[currencyCode]}`;
};

// ─── Plan definitions ──────────────────────────────────────
const plans = [
  {
    id: "free",
    name: "Free",
    description: "Explore the core features at no cost.",
    accent: "border-gray-200",
    highlight: false,
    cta: "Current plan",
    features: [
      "1 active CV",
      "3 job targets",
      "Deep Decoder (3/month)",
      "CV tailoring (3 versions)",
      "Cover letter (3/month)",
      "PDF export",
    ],
    missing: [
      "Gap-to-Goal Roadmap",
      "Company Intelligence Panel",
      "Industry Transition Mode",
      "Speed Mode",
      "Interview Prep & Mock Interview",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    description: "For active job seekers targeting multiple roles.",
    accent: "border-brand-200",
    highlight: false,
    cta: "Upgrade to Starter",
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
    badge: "Most popular",
    description: "The full intelligence layer for serious job seekers.",
    accent: "border-brand-600",
    highlight: true,
    cta: "Upgrade to Pro",
    features: [
      "Unlimited CVs",
      "Unlimited job targets",
      "Everything in Starter",
      "Industry Transition Mode",
      "Speed Mode — bulk score 10 jobs",
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
    badge: "Teams & power users",
    description: "For professionals who apply at scale or want every edge.",
    accent: "border-amber-400",
    highlight: false,
    cta: "Upgrade to Pro+",
    features: [
      "Everything in Pro",
      "Verification badge (LinkedIn sync)",
      "Recruiter-mode profile",
      "Custom branding on exports",
      "API access (beta)",
      "Early access to new features",
      "Dedicated support",
    ],
    missing: [],
  },
];

// ─── Icons ─────────────────────────────────────────────────
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-teal-500 shrink-0 mt-0.5">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const CrossIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 shrink-0 mt-0.5">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ChevronIcon = ({ open }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 shrink-0 text-gray-400 ${open ? "rotate-180" : ""}`}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// ─── Plan card ─────────────────────────────────────────────
const PlanCard = ({ plan, isCurrentPlan, billing, currencyCode, onSelect, isLoading }) => {
  const isFree = plan.id === "free";
  const priceDisplay = isFree ? "Free" : formatPrice(plan.id, currencyCode, billing);
  const originalDisplay = !isFree && billing === "annual"
    ? formatOriginalPrice(plan.id, currencyCode)
    : null;

  return (
    <div className={`relative bg-white rounded-2xl border-2 ${plan.accent} ${plan.highlight ? "shadow-2xl ring-1 ring-brand-600/10" : "shadow-card"} flex flex-col transition-all duration-200 hover:shadow-xl`}>
      {plan.badge && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
          <span className={`text-xs font-bold px-3 py-1 rounded-full text-white whitespace-nowrap ${plan.highlight ? "bg-brand-600" : "bg-amber-500"}`}>
            {plan.badge}
          </span>
        </div>
      )}

      <div className="p-6 flex-1">
        <div className="mb-5">
          <h3 className="text-base font-bold text-gray-900">{plan.name}</h3>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">{plan.description}</p>
        </div>

        <div className="mb-6 pb-5 border-b border-gray-50">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-gray-900">{priceDisplay}</span>
            {!isFree && <span className="text-sm text-gray-400">/mo</span>}
          </div>
          {billing === "annual" && !isFree && (
            <p className="text-xs text-teal-600 font-medium mt-1">
              Billed annually · was {originalDisplay}/mo
            </p>
          )}
          {isFree && <p className="text-xs text-gray-400 mt-1">Free forever</p>}
        </div>

        <ul className="space-y-2.5">
          {plan.features.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
              <CheckIcon />
              {f}
            </li>
          ))}
          {plan.missing.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
              <CrossIcon />
              {f}
            </li>
          ))}
        </ul>
      </div>

      <div className="px-6 pb-6">
        <Button
          variant={plan.highlight && !isCurrentPlan ? "primary" : "outline"}
          fullWidth
          disabled={isCurrentPlan || (isFree && !isCurrentPlan)}
          isLoading={isLoading}
          onClick={() => !isCurrentPlan && !isFree && onSelect(plan.id)}
        >
          {isCurrentPlan ? "Current plan" : plan.cta}
        </Button>
      </div>
    </div>
  );
};

// ─── FAQ ───────────────────────────────────────────────────
const faqItems = [
  {
    q: "Can I cancel or downgrade at any time?",
    a: "Yes — no lock-ins. You can switch to a lower plan or cancel at any time from your account settings. Your CVs, cover letters, and job data are always preserved.",
  },
  {
    q: "Will my tailored CVs be deleted if I downgrade?",
    a: "No. All CV versions and data you've created stay saved. Downgrading only limits how many new versions you can create going forward.",
  },
  {
    q: "Is there a free trial for Pro?",
    a: "The Free plan lets you test all core features before committing. Pro includes a 7-day money-back guarantee.",
  },
  {
    q: "What payment methods are supported?",
    a: "Card (Visa, Mastercard), Apple Pay, Google Pay, bank transfer, and USSD — all supported via Paystack. Nigerian users pay in Naira with zero FX fees.",
  },
  {
    q: "Are prices shown in my currency?",
    a: "Yes — switch between USD, GBP, and NGN using the currency selector. Nigerian pricing is fixed at the Naira rate shown, no hidden FX charges.",
  },
  {
    q: "Is my data sold to recruiters or third parties?",
    a: "Never. Your CV and job data belong to you. We do not sell, share, or licence your personal data to any third party.",
  },
];

const FAQItem = ({ item }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <span className="text-sm font-semibold text-gray-900">{item.q}</span>
        <ChevronIcon open={open} />
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-sm text-gray-500 leading-relaxed">{item.a}</p>
        </div>
      )}
    </div>
  );
};

// ─── Load Paystack inline script once ─────────────────────
const usePaystackScript = () => {
  const [ready, setReady] = useState(!!window.PaystackPop);
  useEffect(() => {
    if (window.PaystackPop) return;
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.onload = () => setReady(true);
    document.head.appendChild(script);
  }, []);
  return ready;
};

// ─── Pricing page ──────────────────────────────────────────
const Pricing = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);
  const paystackReady = usePaystackScript();

  const [billing, setBilling] = useState("monthly");
  const [currencyCode, setCurrencyCode] = useState("NGN");
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoValidating, setPromoValidating] = useState(false);
  const [promoResult, setPromoResult] = useState(null); // { valid, codeId, discountType, discountValue, description }

  const currentPlan = user?.plan || "free";

  const validatePromo = async () => {
    if (!promoCode.trim()) return;
    setPromoValidating(true);
    try {
      const result = await api.post("/promo/validate", { code: promoCode.trim() });
      setPromoResult(result);
      toast.success(`Promo applied: ${result.description || "Discount active"}`);
    } catch (err) {
      setPromoResult(null);
      toast.error(err.message || "Invalid promo code");
    } finally {
      setPromoValidating(false);
    }
  };

  // Handle redirect-based gateway callbacks (Stripe, Flutterwave)
  useEffect(() => {
    const ref    = searchParams.get("ref");       // Stripe: ?ref={CHECKOUT_SESSION_ID}
    const txRef  = searchParams.get("tx_ref");    // Flutterwave: ?tx_ref=seevv_...
    const status = searchParams.get("status");    // Flutterwave: ?status=successful
    const gateway = searchParams.get("gateway");  // optional marker

    const refToVerify = ref || (status === "successful" ? txRef : null);
    if (!refToVerify || !user) return;

    setVerifying(true);
    api.get(`/payments/verify/${refToVerify}`)
      .then((data) => {
        toast.success(`You're now on the ${data.plan} plan. Welcome to the full Seevv experience!`);
        // Clean URL then redirect to dashboard
        window.history.replaceState({}, "", "/pricing");
        navigate("/dashboard");
      })
      .catch((err) => {
        toast.error(`Payment verification failed: ${err.message}. Contact support if you were charged.`);
        window.history.replaceState({}, "", "/pricing");
      })
      .finally(() => setVerifying(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSelect = useCallback(async (planId) => {
    if (!user) {
      toast.info("Please log in to upgrade your plan.");
      navigate("/login");
      return;
    }

    const planKey = PLAN_KEY[planId]?.[currencyCode];
    if (!planKey) {
      toast.error("This plan/currency combination is not available yet.");
      return;
    }

    setLoadingPlan(planId);

    try {
      const callbackUrl = `${window.location.origin}/pricing`;
      const result = await api.post("/payments/initialize", { planKey, callbackUrl, cancelUrl: callbackUrl });

      if (result.flow === "popup") {
        // Paystack inline popup
        if (!paystackReady) {
          toast.error("Payment system is loading, please try again in a moment.");
          setLoadingPlan(null);
          return;
        }
        const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
        const popup = window.PaystackPop.setup({
          key: publicKey,
          email: user.email,
          amount: PRICE_MAP[planId][currencyCode] * 100,
          currency: currencyCode,
          ref: result.reference,
          access_code: result.access_code,
          metadata: { planId, planKey },
          onSuccess: async (txn) => {
            try {
              setLoadingPlan(planId);
              await api.get(`/payments/verify/${txn.reference}`);
              toast.success(`You're now on the ${planId} plan. Welcome to the full Seevv experience!`);
              navigate("/dashboard");
            } catch (err) {
              toast.error(`Payment received but upgrade failed: ${err.message}. Contact support.`);
            } finally {
              setLoadingPlan(null);
            }
          },
          onCancel: () => {
            setLoadingPlan(null);
            toast.info("Payment cancelled.");
          },
        });
        popup.openIframe();
      } else {
        // Stripe / Flutterwave hosted checkout redirect
        window.location.href = result.authorization_url;
      }
    } catch (err) {
      toast.error(err.message || "Failed to start payment. Please try again.");
      setLoadingPlan(null);
    }
  }, [user, paystackReady, currencyCode, navigate, toast]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Payment verification overlay (redirect flow callback) */}
      {verifying && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-brand-600 border-t-transparent animate-spin" />
          <p className="text-sm font-semibold text-gray-800">Verifying your payment…</p>
          <p className="text-xs text-gray-400">Please don't close this tab</p>
        </div>
      )}
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

      <div className="max-w-5xl mx-auto px-4 lg:px-6 pt-10">
        {/* Controls row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <div className="inline-flex items-center bg-gray-100 rounded-full p-1 gap-1">
            <button
              onClick={() => setBilling("monthly")}
              className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-all cursor-pointer ${billing === "monthly" ? "bg-white text-gray-900 shadow-card" : "text-gray-500"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("annual")}
              className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-all cursor-pointer ${billing === "annual" ? "bg-white text-gray-900 shadow-card" : "text-gray-500"}`}
            >
              Annual
              <span className="ml-1.5 text-teal-600">-25%</span>
            </button>
          </div>

          <div className="inline-flex items-center bg-gray-100 rounded-full p-1 gap-1">
            {currencies.map((c) => (
              <button
                key={c.code}
                onClick={() => setCurrencyCode(c.code)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all cursor-pointer ${currencyCode === c.code ? "bg-white text-gray-900 shadow-card" : "text-gray-500"}`}
              >
                {c.symbol} {c.label}
              </button>
            ))}
          </div>
        </div>

        {billing === "annual" && (
          <p className="text-center text-xs text-teal-700 font-medium -mt-6 mb-8">
            Save 25% with annual billing
          </p>
        )}

        {/* Promo code */}
        <div className="mb-6">
          <button
            onClick={() => setPromoOpen((p) => !p)}
            className="text-xs text-brand-600 hover:text-brand-800 font-medium cursor-pointer transition-colors flex items-center gap-1 mx-auto"
          >
            Have a promo code?
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${promoOpen ? "rotate-180" : ""}`}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          {promoOpen && (
            <div className="mt-3 flex gap-2 max-w-sm mx-auto">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoResult(null); }}
                placeholder="Enter promo code"
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600"
              />
              <Button size="sm" variant="outline" onClick={validatePromo} isLoading={promoValidating} disabled={!promoCode.trim()}>
                Apply
              </Button>
            </div>
          )}
          {promoResult?.valid && (
            <p className="text-xs text-teal-600 font-medium text-center mt-2">
              ✓ {promoResult.discountType === "percent" ? `${promoResult.discountValue}% off` : `${promoResult.discountValue} off`} — {promoResult.description}
            </p>
          )}
        </div>

        {/* Plan grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrentPlan={currentPlan === plan.id}
              billing={billing}
              currencyCode={currencyCode}
              onSelect={handleSelect}
              isLoading={loadingPlan === plan.id}
            />
          ))}
        </div>

        {/* Gateway badge */}
        <div className="mt-8 flex flex-col items-center gap-2">
          <p className="text-xs text-gray-400">
            Payments secured by{" "}
            <span className="font-semibold text-gray-600">Paystack · Stripe · Flutterwave</span>
            {" "}· Card, bank transfer, and local payment methods supported
          </p>
          <p className="text-xs text-gray-300">
            Nigerian users pay in ₦ with no FX fees · Visa, Mastercard, Verve accepted
          </p>
        </div>

        {/* Trust bar */}
        <div className="mt-8 flex flex-wrap justify-center items-center gap-6 text-xs text-gray-400">
          {[
            { icon: "M7 11V7a5 5 0 0 1 10 0v4M3 11h18v10H3z", label: "Cancel anytime" },
            { icon: "M20 6 9 17 4 12", label: "7-day money-back guarantee" },
            { icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", label: "No data sold, ever" },
            { icon: "M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z", label: "Instant access on upgrade" },
          ].map((item, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
              {item.label}
            </span>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-14 max-w-2xl mx-auto">
          <h2 className="text-lg font-bold text-gray-900 mb-6 text-center">Frequently asked questions</h2>
          <div className="space-y-2">
            {faqItems.map((item, i) => (
              <FAQItem key={i} item={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
