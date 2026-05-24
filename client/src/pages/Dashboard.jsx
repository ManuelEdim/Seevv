import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store";
import {
  MetricCard,
  JobTargetCard,
  EmptyState,
  Button,
  Spinner,
} from "@/components/ui";
import AddJobModal from "@/components/AddJobModal";
import useDashboard from "@/hooks/useDashboard";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/context/ToastContext";
import { PLAN_LABELS, PLAN_HIERARCHY, hasFeature } from "@/lib/features";

// ─── Plan badge styles ─────────────────────────────────────

const PLAN_BADGE = {
  free:     { pill: "bg-white/20 text-white/90",        dot: "bg-white/60" },
  starter:  { pill: "bg-teal-400/30 text-teal-100",     dot: "bg-teal-300" },
  pro:      { pill: "bg-amber-400/30 text-amber-100",   dot: "bg-amber-300" },
  pro_plus: { pill: "bg-purple-400/30 text-purple-100", dot: "bg-purple-300" },
};

// ─── Feature tile data ─────────────────────────────────────
// grad: [fromColor, toColor] used for the card header "image"

const FEATURE_GROUPS = [
  {
    name: "Essentials",
    plan: "free",
    headerCls: "text-gray-500",
    upgradeTo: null,
    tiles: [
      {
        key: "decoder",
        label: "Deep Decoder",
        desc: "Uncover what the job really needs",
        route: "/decoder",
        grad: ["#534ab7", "#7c3aed"],
        icon: (c) => (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            <line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        ),
      },
      {
        key: "cv_tailoring",
        label: "CV Tailoring",
        desc: "AI-tailored for every role",
        route: "/cv",
        grad: ["#033876", "#0a5aad"],
        icon: (c) => (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        ),
      },
      {
        key: "cover_letter",
        label: "Cover Letters",
        desc: "Voice-matched, not generic",
        route: "/cover-letter",
        grad: ["#1d9e75", "#059669"],
        icon: (c) => (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        ),
      },
      {
        key: null,
        label: "App Tracker",
        desc: "Track your pipeline status",
        route: "/tracker",
        grad: ["#ef9f27", "#d97706"],
        icon: (c) => (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        ),
      },
    ],
  },
  {
    name: "Growth",
    plan: "starter",
    headerCls: "text-teal-600",
    upgradeTo: "Starter",
    upgradeColor: "teal",
    tiles: [
      {
        key: "gap_roadmap",
        label: "Gap Roadmap",
        desc: "Bridge your skill gaps fast",
        route: "/gap-roadmap",
        grad: ["#1d9e75", "#10b981"],
        icon: (c) => (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 17l4-8 4 5 4-3 4 6" /><path d="M21 21H3" />
          </svg>
        ),
      },
      {
        key: "company_intel",
        label: "Company Intel",
        desc: "Research any employer deeply",
        route: "/company-intel",
        grad: ["#033876", "#1e40af"],
        icon: (c) => (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        ),
      },
      {
        key: "skills_graph",
        label: "Skills Graph",
        desc: "Visualise your skill landscape",
        route: "/skills",
        grad: ["#534ab7", "#6d28d9"],
        icon: (c) => (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" />
          </svg>
        ),
      },
      {
        key: "proof_of_work",
        label: "Proof of Work",
        desc: "Showcase real achievements",
        route: "/proof-of-work",
        grad: ["#ef9f27", "#b45309"],
        icon: (c) => (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
          </svg>
        ),
      },
      {
        key: "voice_mirroring",
        label: "Voice Mirroring",
        desc: "Write in your natural voice",
        route: "/voice-mirror",
        grad: ["#0d9488", "#059669"],
        icon: (c) => (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        ),
      },
      {
        key: "rejection_intel",
        label: "Rejection Intel",
        desc: "Turn rejections into learnable data",
        route: "/rejection-intel",
        grad: ["#dc2626", "#b91c1c"],
        icon: (c) => (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
          </svg>
        ),
      },
    ],
  },
  {
    name: "Pro Tools",
    plan: "pro",
    headerCls: "text-amber-600",
    upgradeTo: "Pro",
    upgradeColor: "amber",
    tiles: [
      {
        key: "interview_prep",
        label: "Interview Prep",
        desc: "Practice before the real thing",
        route: "/interview-prep",
        grad: ["#033876", "#1e3a8a"],
        icon: (c) => (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        ),
      },
      {
        key: "mock_interview",
        label: "Mock Interview",
        desc: "AI-powered live simulations",
        route: "/mock-interview",
        grad: ["#dc2626", "#b91c1c"],
        icon: (c) => (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
        ),
      },
      {
        key: "speed_mode",
        label: "Speed Mode",
        desc: "Apply to 10 jobs in 10 minutes",
        route: "/speed-mode",
        grad: ["#ea580c", "#d97706"],
        icon: (c) => (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        ),
      },
      {
        key: "transition_mode",
        label: "Transition Mode",
        desc: "Pivot industries with confidence",
        route: "/transition",
        grad: ["#534ab7", "#4338ca"],
        icon: (c) => (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
        ),
      },
      {
        key: "analytics",
        label: "Analytics",
        desc: "Track what's working across roles",
        route: "/analytics",
        grad: ["#1d9e75", "#047857"],
        icon: (c) => (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        ),
      },
      {
        key: "negotiation_coach",
        label: "Negotiation Coach",
        desc: "Win every salary conversation",
        route: "/negotiation-coach",
        grad: ["#059669", "#047857"],
        icon: (c) => (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        ),
      },
      {
        key: "recruiter_outreach",
        label: "Recruiter Outreach",
        desc: "Personalized messages that get replies",
        route: "/recruiter-outreach",
        grad: ["#7c3aed", "#6d28d9"],
        icon: (c) => (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        ),
      },
      {
        key: "apply_assist",
        label: "Apply Assist",
        desc: "Apply to any role in under 2 minutes",
        route: "/apply-assist",
        grad: ["#0d9488", "#0f766e"],
        icon: (c) => (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
        ),
      },
    ],
  },
  {
    name: "Premium",
    plan: "pro_plus",
    headerCls: "text-brand-600",
    upgradeTo: "Pro+",
    upgradeColor: "brand",
    tiles: [
      {
        key: "verification",
        label: "Verification",
        desc: "Add trust badges to your profile",
        route: "/verification",
        grad: ["#1d9e75", "#065f46"],
        icon: (c) => (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" />
          </svg>
        ),
      },
      {
        key: "custom_branding",
        label: "Custom Branding",
        desc: "Your colours in every export",
        route: "/branding",
        grad: ["#b45309", "#92400e"],
        icon: (c) => (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="13.5" cy="6.5" r=".5" /><circle cx="17.5" cy="10.5" r=".5" />
            <circle cx="8.5" cy="7.5" r=".5" /><circle cx="6.5" cy="12.5" r=".5" />
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
          </svg>
        ),
      },
      {
        key: "api_access",
        label: "API Access",
        desc: "Integrate Seevv into your workflow",
        route: "/api-access",
        grad: ["#4338ca", "#3730a3"],
        icon: (c) => (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
          </svg>
        ),
      },
      {
        key: "recruiter_mode",
        label: "Recruiter Mode",
        desc: "Get discovered by top employers",
        route: "/recruiter",
        grad: ["#033876", "#1e40af"],
        icon: (c) => (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>
        ),
      },
    ],
  },
];

// ─── Big feature card (accessible) ────────────────────────

const FeatureCard = ({ tile, navigate }) => {
  const patId = `pat-${tile.key || "tracker"}`;
  const [from, to] = tile.grad;

  return (
    <button
      onClick={() => navigate(tile.route)}
      className="group text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden cursor-pointer w-full"
    >
      {/* Card header — acts as the "image" */}
      <div
        className="relative h-28 overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}
      >
        {/* Repeating circle texture */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id={patId} x="0" y="0" width="36" height="36" patternUnits="userSpaceOnUse">
              <circle cx="18" cy="18" r="12" fill="none" stroke="white" strokeWidth="1" strokeOpacity="0.12" />
              <circle cx="18" cy="18" r="5"  fill="white" fillOpacity="0.05" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${patId})`} />
        </svg>

        {/* Decorative blobs */}
        <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -bottom-5 -left-5 w-20 h-20 rounded-full bg-black/15 pointer-events-none" />

        {/* Icon pill — bottom-left */}
        <div className="absolute bottom-3 left-4 w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20">
          {tile.icon("white")}
        </div>

        {/* Arrow — appears on hover */}
        <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
          </svg>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        <p className="text-sm font-semibold text-gray-900 group-hover:text-brand-700 transition-colors leading-tight">
          {tile.label}
        </p>
        <p className="text-xs text-gray-400 mt-1 leading-snug">{tile.desc}</p>
        <p className="mt-3 text-[11px] font-semibold text-brand-500 group-hover:text-brand-700 transition-colors">
          Open →
        </p>
      </div>
    </button>
  );
};

// ─── Compact locked-tier card ──────────────────────────────

const UPGRADE_STYLES = {
  teal:  { border: "border-teal-100",  bg: "bg-teal-50",  text: "text-teal-700",  btn: "bg-teal-600 hover:bg-teal-700",  pill: "bg-teal-100 text-teal-700"  },
  amber: { border: "border-amber-100", bg: "bg-amber-50", text: "text-amber-700", btn: "bg-amber-500 hover:bg-amber-600", pill: "bg-amber-100 text-amber-700" },
  brand: { border: "border-brand-100", bg: "bg-brand-50", text: "text-brand-700", btn: "bg-brand-600 hover:bg-brand-800", pill: "bg-brand-100 text-brand-700" },
};

const LockedTierCard = ({ group, navigate }) => {
  const s = UPGRADE_STYLES[group.upgradeColor] || UPGRADE_STYLES.brand;

  return (
    <div className={`rounded-2xl border ${s.border} ${s.bg} p-5`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <span className={`text-[10px] font-bold uppercase tracking-widest ${s.text}`}>
            {group.name}
          </span>
          <p className="text-sm font-semibold text-gray-800 mt-0.5">
            Unlock with {group.upgradeTo} plan
          </p>
        </div>
        <div className="p-2 rounded-xl bg-white border border-gray-100 shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
      </div>

      {/* Feature pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {group.tiles.map((tile) => (
          <div
            key={tile.label}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-gray-100 text-xs font-medium text-gray-500"
          >
            <span className="w-3.5 h-3.5 shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5">{tile.icon("#9ca3af")}</span>
            {tile.label}
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={() => navigate("/pricing")}
        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white ${s.btn} transition-colors cursor-pointer`}
      >
        Upgrade to {group.upgradeTo}
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

// ─── Feature grid ──────────────────────────────────────────

const FeatureGrid = ({ plan, overrides, navigate }) => {
  const userIdx = PLAN_HIERARCHY.indexOf(plan || "free");

  // Split into accessible tiles and locked groups
  const accessibleTiles = [];
  const lockedGroups = [];

  FEATURE_GROUPS.forEach((group) => {
    const groupIdx = PLAN_HIERARCHY.indexOf(group.plan);
    const groupAccessible = userIdx >= groupIdx;

    if (groupAccessible) {
      group.tiles.forEach((tile) => {
        const accessible = tile.key === null || hasFeature(plan, tile.key, overrides);
        if (accessible) accessibleTiles.push(tile);
      });
    } else {
      lockedGroups.push(group);
    }
  });

  return (
    <div className="mb-8">
      {/* Active tools */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900">Your tools</h2>
        <span className="text-[11px] text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
          {PLAN_LABELS[plan] || "Free"} plan
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {accessibleTiles.map((tile) => (
          <FeatureCard key={tile.label} tile={tile} navigate={navigate} />
        ))}
      </div>

      {/* Locked tiers */}
      {lockedGroups.length > 0 && (
        <>
          <div className="flex items-center gap-3 mb-4 mt-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
              More tools available
            </span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {lockedGroups.map((group) => (
              <LockedTierCard key={group.name} group={group} navigate={navigate} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ─── Hero banner ───────────────────────────────────────────

const HeroBanner = ({ name, plan, metrics, onAddJob }) => {
  const planBadge = PLAN_BADGE[plan] || PLAN_BADGE.free;
  const planLabel = PLAN_LABELS[plan] || "Free";

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const subtitle = metrics.totalApplications > 0
    ? `${metrics.totalApplications} role${metrics.totalApplications !== 1 ? "s" : ""} applied to · ${metrics.cvVersions} tailored CV version${metrics.cvVersions !== 1 ? "s" : ""}`
    : "Ready to land your next role? Add a job target to get started.";

  return (
    <div
      className="rounded-2xl p-5 lg:p-7 text-white mb-6 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #033876 0%, #0a5aad 60%, #0d6ecc 100%)" }}
    >
      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hero-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>
      </div>

      {/* Glow blobs */}
      <div className="absolute top-[-40px] right-[10%] w-56 h-56 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: "#1d9e75" }} />
      <div className="absolute bottom-[-60px] left-[5%] w-48 h-48 rounded-full opacity-15 blur-3xl pointer-events-none" style={{ background: "#ef9f27" }} />

      <div className="relative z-10 flex items-center justify-between gap-4">
        {/* Left: text */}
        <div className="flex-1 min-w-0">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold mb-3 ${planBadge.pill}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${planBadge.dot}`} />
            {planLabel} plan
          </div>
          <h2 className="text-xl lg:text-2xl font-bold text-white mb-1.5">
            {greeting}{name ? `, ${name.split(" ")[0]}` : ""}
          </h2>
          <p className="text-brand-200 text-sm leading-relaxed max-w-sm">{subtitle}</p>

          <button
            onClick={onAddJob}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-brand-600 text-sm font-semibold hover:bg-brand-50 transition-all shadow-sm cursor-pointer"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add a role
          </button>
        </div>

        {/* Right: career illustration */}
        <div className="hidden sm:block shrink-0 relative">
          <div className="relative w-32 h-32 lg:w-40 lg:h-40">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden border-2 border-white/25 shadow-2xl">
              <img
                src="/img4.jpg"
                alt=""
                className="w-full h-full object-cover object-top"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-900/40 to-transparent" />
            </div>
            {/* AI badge */}
            <div className="absolute -bottom-2 -right-2 bg-teal-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg whitespace-nowrap z-10">
              ✦ AI Ready
            </div>
            {/* Stats pill */}
            {metrics.avgMatchScore > 0 && (
              <div className="absolute -top-2 -left-3 bg-white text-brand-700 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg whitespace-nowrap z-10">
                {metrics.avgMatchScore}% avg match
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Dashboard ─────────────────────────────────────────────

const Dashboard = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const { toast } = useToast();
  const [isAddJobOpen, setIsAddJobOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const {
    isLoading,
    error,
    metrics,
    jobTargets,
    refetch,
    addJobOptimistically,
  } = useDashboard();

  const plan = profile?.plan || "free";
  const overrides = profile?.feature_overrides || {};
  const fullName = user?.user_metadata?.full_name || profile?.full_name || "";

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm("Delete this role? This cannot be undone.")) return;
    const { error } = await supabase
      .from("job_targets")
      .delete()
      .eq("id", jobId)
      .eq("user_id", user.id);
    if (error) {
      toast.error("Failed to delete role.");
    } else {
      toast.success("Role deleted.");
      refetch();
    }
  };

  const filteredJobs =
    statusFilter === "all"
      ? jobTargets
      : jobTargets.filter((j) => j.status === statusFilter);

  const statusFilters = [
    { value: "all",       label: "All" },
    { value: "saved",     label: "Saved" },
    { value: "applied",   label: "Applied" },
    { value: "interview", label: "Interview" },
    { value: "offer",     label: "Offer" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-sm text-coral-600">Failed to load dashboard</p>
        <Button variant="outline" onClick={refetch}>Try again</Button>
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      <HeroBanner
        name={fullName}
        plan={plan}
        metrics={metrics}
        onAddJob={() => setIsAddJobOpen(true)}
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-8">
        <MetricCard label="Applications"     value={metrics.totalApplications}                                    sub="roles applied to"    color="brand" />
        <MetricCard label="Avg match score"  value={metrics.avgMatchScore > 0 ? `${metrics.avgMatchScore}%` : "—"} sub="across all versions"  color="teal" />
        <MetricCard label="Interviews"       value={metrics.interviews}                                           sub="from applications"    color="amber" />
        <MetricCard label="CV versions"      value={metrics.cvVersions}                                           sub="tailored versions"    color="coral" />
      </div>

      {/* Feature grid */}
      <FeatureGrid plan={plan} overrides={overrides} navigate={navigate} />

      {/* Targeted roles */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 lg:px-6 py-4 border-b border-gray-50">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Targeted roles</h2>
            {jobTargets.length > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">{jobTargets.length} total · click any role to decode it</p>
            )}
          </div>
          <Button variant="primary" size="sm" onClick={() => setIsAddJobOpen(true)}>
            + Add role
          </Button>
        </div>

        {/* Status filter tabs */}
        {jobTargets.length > 0 && (
          <div className="flex gap-1 px-4 lg:px-6 py-3 border-b border-gray-50 overflow-x-auto">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                  statusFilter === filter.value
                    ? "bg-brand-50 text-brand-700"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                }`}
              >
                {filter.label}
                {filter.value === "all" && (
                  <span className="ml-1.5 text-gray-300">{jobTargets.length}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {filteredJobs.length === 0 ? (
          <EmptyState
            icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#033876" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                <line x1="12" y1="12" x2="12" y2="16" /><line x1="10" y1="14" x2="14" y2="14" />
              </svg>
            }
            title={statusFilter === "all" ? "No roles added yet" : `No ${statusFilter} roles`}
            description={
              statusFilter === "all"
                ? "Add a job target and Seevv will decode what the company actually needs, then tailor your CV for it."
                : `You don't have any roles with status "${statusFilter}" yet.`
            }
            action={statusFilter === "all" ? () => setIsAddJobOpen(true) : null}
            actionLabel="Add your first role"
          />
        ) : (
          <div className="p-3 lg:p-4 grid gap-3">
            {filteredJobs.map((job) => (
              <JobTargetCard key={job.id} job={job} onDelete={handleDeleteJob} />
            ))}
          </div>
        )}
      </div>

      <AddJobModal
        isOpen={isAddJobOpen}
        onClose={() => setIsAddJobOpen(false)}
        onSuccess={refetch}
        onOptimisticAdd={addJobOptimistically}
      />
    </div>
  );
};

export default Dashboard;
