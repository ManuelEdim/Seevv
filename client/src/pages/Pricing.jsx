import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui";
import { useToast } from "@/context/ToastContext";

// ─── Currency config ───────────────────────────────────────
const currencies = [
  { code: "USD", symbol: "$", label: "USD", rates: { monthly: 1, annual: 1 } },
  { code: "GBP", symbol: "£", label: "GBP", rates: { monthly: 0.79, annual: 0.79 } },
  { code: "NGN", symbol: "₦", label: "NGN", rates: { monthly: 1600, annual: 1600 } },
];

const formatPrice = (usdPrice, currency, billing) => {
  if (usdPrice === 0) return `${currency.symbol}0`;
  const rate = currency.rates[billing];
  const converted = usdPrice * rate;
  if (currency.code === "NGN") {
    return `${currency.symbol}${Math.round(converted / 100) * 100}`;
  }
  return `${currency.symbol}${Math.round(converted)}`;
};

// ─── Plan definitions ──────────────────────────────────────
const plans = [
  {
    id: "free",
    name: "Free",
    price: { monthly: 0, annual: 0 },
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
      "Voice mirroring",
      "Interview Prep & Mock Interview",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    price: { monthly: 9, annual: 7 },
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
    price: { monthly: 19, annual: 15 },
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
    price: { monthly: 39, annual: 29 },
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
const PlanCard = ({ plan, isCurrentPlan, billing, currency, onSelect }) => {
  const priceDisplay = formatPrice(
    billing === "annual" ? plan.price.annual : plan.price.monthly,
    currency,
    billing,
  );
  const originalDisplay = billing === "annual" && plan.price.monthly > 0
    ? formatPrice(plan.price.monthly, currency, billing)
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
        {/* Plan name + description */}
        <div className="mb-5">
          <h3 className="text-base font-bold text-gray-900">{plan.name}</h3>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">{plan.description}</p>
        </div>

        {/* Price */}
        <div className="mb-6 pb-5 border-b border-gray-50">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-gray-900">{priceDisplay}</span>
            {plan.price.monthly > 0 && (
              <span className="text-sm text-gray-400">/mo</span>
            )}
          </div>
          {billing === "annual" && plan.price.monthly > 0 && (
            <p className="text-xs text-teal-600 font-medium mt-1">
              Billed annually · was {originalDisplay}/mo
            </p>
          )}
          {plan.price.monthly === 0 && (
            <p className="text-xs text-gray-400 mt-1">Free forever</p>
          )}
        </div>

        {/* Features */}
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
          disabled={isCurrentPlan}
          onClick={() => !isCurrentPlan && onSelect(plan.id)}
        >
          {isCurrentPlan ? "Current plan" : plan.cta}
        </Button>
      </div>
    </div>
  );
};

// ─── FAQ accordion item ────────────────────────────────────
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
    a: "The Free plan lets you test all core features before committing. When billing launches, Pro will include a 7-day money-back guarantee.",
  },
  {
    q: "What payment methods are supported?",
    a: "Card (Visa, Mastercard), Apple Pay, and Google Pay globally. Nigerian users can pay via Paystack with local card, bank transfer, or USSD — launching soon.",
  },
  {
    q: "Are prices shown in my currency?",
    a: "You can switch between USD, GBP, and NGN using the currency selector above. Nigerian pricing via Paystack is fixed at the NGN rate shown — no hidden FX fees.",
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

// ─── Pricing page ──────────────────────────────────────────
const Pricing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [billing, setBilling] = useState("monthly");
  const [currencyCode, setCurrencyCode] = useState("USD");

  const currency = currencies.find((c) => c.code === currencyCode);
  const currentPlan = "free";

  const handleSelect = (planId) => {
    toast.info(`Billing coming soon — ${planId} plan selected. We'll notify you when payments go live.`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
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
        {/* Controls row: billing + currency */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          {/* Billing toggle */}
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

          {/* Currency selector */}
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
            Save up to 25% with annual billing
          </p>
        )}

        {/* Plan grid — 2 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrentPlan={currentPlan === plan.id}
              billing={billing}
              currency={currency}
              onSelect={handleSelect}
            />
          ))}
        </div>

        {/* Coming soon notice */}
        <div className="mt-8 bg-brand-50 border border-brand-100 rounded-xl px-5 py-4 text-center">
          <p className="text-sm font-semibold text-brand-800">Billing launches soon</p>
          <p className="text-xs text-brand-600 mt-1">
            Click any plan to register your interest — you'll be the first to know when payments go live.
            Nigeria users will be able to pay in Naira via Paystack.
          </p>
        </div>

        {/* Trust bar */}
        <div className="mt-10 flex flex-wrap justify-center items-center gap-6 text-xs text-gray-400">
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
