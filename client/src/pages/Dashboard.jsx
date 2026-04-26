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

// ─── Hero photo element ────────────────────────────────────

const HeroPhoto = () => (
  <div className="relative shrink-0">
    {/* Photo ring glow */}
    <div className="absolute inset-0 rounded-2xl blur-xl opacity-30" style={{ background: "#1d9e75", transform: "scale(1.1)" }} />
    {/* Photo */}
    <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl">
      <img
        src="/img4.jpg"
        alt="Your career, elevated"
        className="w-full h-full object-cover object-top"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-brand-900/30 to-transparent" />
    </div>
    {/* AI badge */}
    <div className="absolute -bottom-2 -right-2 bg-teal-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg whitespace-nowrap">
      ✦ AI Ready
    </div>
  </div>
);

// ─── Plan badge styles ─────────────────────────────────────

const PLAN_BADGE = {
  free:     { pill: "bg-white/20 text-white/90",           dot: "bg-white/60" },
  starter:  { pill: "bg-teal-400/30 text-teal-100",        dot: "bg-teal-300" },
  pro:      { pill: "bg-amber-400/30 text-amber-100",      dot: "bg-amber-300" },
  pro_plus: { pill: "bg-purple-400/30 text-purple-100",    dot: "bg-purple-300" },
};

const TILE_PLAN_BADGE = {
  free:     null,
  starter:  { label: "Starter",  cls: "bg-teal-50 text-teal-600 border-teal-100"    },
  pro:      { label: "Pro",      cls: "bg-amber-50 text-amber-600 border-amber-100"  },
  pro_plus: { label: "Pro+",     cls: "bg-brand-50 text-brand-700 border-brand-100"  },
};

// ─── Feature tile data ─────────────────────────────────────

const FEATURE_GROUPS = [
  {
    name: "Essentials",
    plan: "free",
    headerCls: "text-gray-500",
    tiles: [
      {
        key: "decoder",
        label: "Deep Decoder",
        desc: "Uncover what the job really needs",
        route: "/decoder",
        iconColor: "#534ab7",
        iconBg: "#f0eeff",
        icon: (c) => (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        iconColor: "#033876",
        iconBg: "#e8f0fb",
        icon: (c) => (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        ),
      },
      {
        key: "cover_letter",
        label: "Cover Letters",
        desc: "Voice-matched, not generic",
        route: "/cover-letter",
        iconColor: "#1d9e75",
        iconBg: "#e6f9f3",
        icon: (c) => (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        iconColor: "#ef9f27",
        iconBg: "#fff8ec",
        icon: (c) => (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    tiles: [
      {
        key: "gap_roadmap",
        label: "Gap Roadmap",
        desc: "Bridge your skill gaps fast",
        route: "/gap-roadmap",
        iconColor: "#1d9e75",
        iconBg: "#e6f9f3",
        icon: (c) => (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 17l4-8 4 5 4-3 4 6" /><path d="M21 21H3" />
          </svg>
        ),
      },
      {
        key: "company_intel",
        label: "Company Intel",
        desc: "Research any employer deeply",
        route: "/company-intel",
        iconColor: "#033876",
        iconBg: "#e8f0fb",
        icon: (c) => (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        iconColor: "#534ab7",
        iconBg: "#f0eeff",
        icon: (c) => (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        iconColor: "#ef9f27",
        iconBg: "#fff8ec",
        icon: (c) => (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
          </svg>
        ),
      },
      {
        key: "voice_mirroring",
        label: "Voice Mirroring",
        desc: "Write in your natural voice",
        route: "/voice-mirror",
        iconColor: "#1d9e75",
        iconBg: "#e6f9f3",
        icon: (c) => (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        ),
      },
    ],
  },
  {
    name: "Pro Tools",
    plan: "pro",
    headerCls: "text-amber-600",
    tiles: [
      {
        key: "interview_prep",
        label: "Interview Prep",
        desc: "Practice before the real thing",
        route: "/interview-prep",
        iconColor: "#033876",
        iconBg: "#e8f0fb",
        icon: (c) => (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        ),
      },
      {
        key: "mock_interview",
        label: "Mock Interview",
        desc: "AI-powered live simulations",
        route: "/mock-interview",
        iconColor: "#ef4444",
        iconBg: "#fff0f0",
        icon: (c) => (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        iconColor: "#ef9f27",
        iconBg: "#fff8ec",
        icon: (c) => (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        ),
      },
      {
        key: "transition_mode",
        label: "Transition Mode",
        desc: "Pivot industries with confidence",
        route: "/transition",
        iconColor: "#534ab7",
        iconBg: "#f0eeff",
        icon: (c) => (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        iconColor: "#1d9e75",
        iconBg: "#e6f9f3",
        icon: (c) => (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        ),
      },
    ],
  },
  {
    name: "Premium",
    plan: "pro_plus",
    headerCls: "text-brand-600",
    tiles: [
      {
        key: "verification",
        label: "Verification",
        desc: "Add trust badges to your profile",
        route: "/verification",
        iconColor: "#1d9e75",
        iconBg: "#e6f9f3",
        icon: (c) => (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        iconColor: "#ef9f27",
        iconBg: "#fff8ec",
        icon: (c) => (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        iconColor: "#534ab7",
        iconBg: "#f0eeff",
        icon: (c) => (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
          </svg>
        ),
      },
      {
        key: "recruiter_mode",
        label: "Recruiter Mode",
        desc: "Get discovered by top employers",
        route: "/recruiter",
        iconColor: "#033876",
        iconBg: "#e8f0fb",
        icon: (c) => (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>
        ),
      },
    ],
  },
];

// ─── Feature tile ──────────────────────────────────────────

const FeatureTile = ({ tile, accessible, navigate }) => {
  const handleClick = () => {
    if (accessible) {
      navigate(tile.route);
    } else {
      navigate("/pricing");
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`relative group text-left bg-white rounded-2xl border p-4 transition-all duration-200 cursor-pointer w-full ${
        accessible
          ? "border-gray-100 shadow-sm hover:border-brand-200 hover:shadow-md hover:-translate-y-0.5"
          : "border-gray-100 shadow-sm opacity-60 hover:opacity-80"
      }`}
    >
      {/* Lock badge */}
      {!accessible && (
        <div className="absolute top-3 right-3">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
      )}

      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform duration-200 group-hover:scale-110"
        style={{ backgroundColor: tile.iconBg }}
      >
        {tile.icon(tile.iconColor)}
      </div>

      {/* Label */}
      <p className="text-xs font-semibold text-gray-900 mb-0.5 pr-4">{tile.label}</p>
      <p className="text-[11px] text-gray-400 leading-tight">{tile.desc}</p>

      {/* Plan badge on locked tiles */}
      {!accessible && tile._planBadge && (
        <div className={`mt-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${tile._planBadge.cls}`}>
          {tile._planBadge.label}
        </div>
      )}
    </button>
  );
};

// ─── Feature grid section ──────────────────────────────────

const FeatureGrid = ({ plan, overrides, navigate }) => (
  <div className="mb-8">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-sm font-semibold text-gray-900">Your tools</h2>
      <span className="text-[11px] text-gray-400">
        {PLAN_LABELS[plan] || "Free"} plan
      </span>
    </div>

    {FEATURE_GROUPS.map((group) => {
      const groupMinIdx = PLAN_HIERARCHY.indexOf(group.plan);
      const userIdx = PLAN_HIERARCHY.indexOf(plan || "free");
      const groupAccessible = userIdx >= groupMinIdx;

      const tilesWithMeta = group.tiles.map((tile) => ({
        ...tile,
        _minPlan: group.plan,
        _planBadge: TILE_PLAN_BADGE[group.plan],
      }));

      return (
        <div key={group.name} className="mb-5">
          {/* Group header */}
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${group.headerCls}`}>
              {group.name}
            </span>
            {!groupAccessible && (
              <span className="text-[10px] text-gray-400 font-medium">
                · requires {PLAN_LABELS[group.plan]}
              </span>
            )}
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {tilesWithMeta.map((tile) => {
              const accessible = tile.key === null
                ? true
                : hasFeature(plan, tile.key, overrides);
              return (
                <FeatureTile
                  key={tile.label}
                  tile={tile}
                  accessible={accessible}
                  navigate={navigate}
                />
              );
            })}
          </div>
        </div>
      );
    })}
  </div>
);

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
    ? `You've applied to ${metrics.totalApplications} role${metrics.totalApplications !== 1 ? "s" : ""} · ${metrics.cvVersions} tailored CV version${metrics.cvVersions !== 1 ? "s" : ""} ready`
    : "Ready to land your next role? Add a job target to get started.";

  return (
    <div
      className="rounded-2xl p-5 lg:p-6 text-white mb-6 relative overflow-hidden"
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

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          {/* Plan badge */}
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold mb-3 ${planBadge.pill}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${planBadge.dot}`} />
            {planLabel} plan
          </div>
          <h2 className="text-xl font-bold text-white mb-1">
            {greeting}{name ? `, ${name.split(" ")[0]}` : ""}
          </h2>
          <p className="text-brand-200 text-sm leading-relaxed max-w-md">{subtitle}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block">
            <HeroPhoto />
          </div>
          <button
            onClick={onAddJob}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-brand-600 text-sm font-semibold hover:bg-brand-50 transition-all shadow-sm cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add role
          </button>
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
    { value: "all", label: "All roles" },
    { value: "saved", label: "Saved" },
    { value: "applied", label: "Applied" },
    { value: "interview", label: "Interview" },
    { value: "offer", label: "Offer" },
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
        <p className="text-sm text-coral-600">Failed to load dashboard data</p>
        <Button variant="outline" onClick={refetch}>Try again</Button>
      </div>
    );
  }

  return (
    <div>
      {/* Hero banner — always visible */}
      <HeroBanner
        name={fullName}
        plan={plan}
        metrics={metrics}
        onAddJob={() => setIsAddJobOpen(true)}
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-8">
        <MetricCard
          label="Applications"
          value={metrics.totalApplications}
          sub="roles applied to"
          color="brand"
        />
        <MetricCard
          label="Avg. match score"
          value={metrics.avgMatchScore > 0 ? `${metrics.avgMatchScore}%` : "—"}
          sub="across all versions"
          color="teal"
        />
        <MetricCard
          label="Interviews"
          value={metrics.interviews}
          sub="from applications"
          color="amber"
        />
        <MetricCard
          label="CV versions"
          value={metrics.cvVersions}
          sub="tailored versions"
          color="coral"
        />
      </div>

      {/* Feature discovery tiles */}
      <FeatureGrid plan={plan} overrides={overrides} navigate={navigate} />

      {/* Job targets section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card">
        <div className="flex items-center justify-between px-4 lg:px-6 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-900">
            Targeted roles
            {jobTargets.length > 0 && (
              <span className="ml-2 text-xs font-normal text-gray-400">
                {jobTargets.length} total
              </span>
            )}
          </h2>
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

        {/* Job list or empty state */}
        {filteredJobs.length === 0 ? (
          <EmptyState
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
            }
            title={statusFilter === "all" ? "No roles added yet" : `No ${statusFilter} roles`}
            description={
              statusFilter === "all"
                ? "Add your first job target and Seevv will decode what the company actually needs, then tailor your CV for it."
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

      {/* Add job modal */}
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
