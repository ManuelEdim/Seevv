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

// ─── Inline SVG illustration for the welcome banner ───────

const DashboardIllustration = () => (
  <svg
    viewBox="0 0 160 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-36 h-28 opacity-90"
    aria-hidden="true"
  >
    {/* Main card */}
    <rect x="16" y="14" width="88" height="92" rx="10" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />
    {/* Avatar */}
    <circle cx="36" cy="36" r="12" fill="rgba(255,255,255,0.18)" />
    <circle cx="36" cy="32" r="5" fill="rgba(255,255,255,0.5)" />
    <ellipse cx="36" cy="43" rx="8" ry="5" fill="rgba(255,255,255,0.25)" />
    {/* Name lines */}
    <rect x="53" y="28" width="38" height="5" rx="2.5" fill="rgba(255,255,255,0.65)" />
    <rect x="53" y="37" width="28" height="4" rx="2" fill="rgba(255,255,255,0.3)" />
    {/* Divider */}
    <line x1="24" y1="56" x2="96" y2="56" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
    {/* Content lines */}
    <rect x="24" y="64" width="68" height="3.5" rx="1.75" fill="rgba(255,255,255,0.25)" />
    <rect x="24" y="72" width="56" height="3.5" rx="1.75" fill="rgba(255,255,255,0.25)" />
    <rect x="24" y="80" width="62" height="3.5" rx="1.75" fill="rgba(255,255,255,0.25)" />
    <rect x="24" y="88" width="44" height="3.5" rx="1.75" fill="rgba(255,255,255,0.25)" />

    {/* Match score ring — floating top right */}
    <rect x="100" y="10" width="48" height="48" rx="10" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
    <circle cx="124" cy="34" r="16" stroke="rgba(255,255,255,0.2)" strokeWidth="3" fill="none" />
    <circle cx="124" cy="34" r="16" stroke="#1d9e75" strokeWidth="3" fill="none"
      strokeDasharray="88 13" strokeLinecap="round"
      transform="rotate(-90 124 34)" />
    <text x="124" y="38" fontSize="9" fontWeight="700" fill="white" textAnchor="middle" fontFamily="Arial,sans-serif">88%</text>

    {/* AI badge */}
    <rect x="88" y="92" width="64" height="20" rx="10" fill="#1d9e75" />
    <text x="120" y="106" fontSize="9" fontWeight="600" fill="white" textAnchor="middle" fontFamily="Arial,sans-serif">✦ AI Ready</text>

    {/* Sparkles */}
    <path d="M8 60 L10 56 L12 60 L8 62 Z" fill="rgba(255,255,255,0.4)" />
    <path d="M148 60 L150 56 L152 60 L148 62 Z" fill="#ef9f27" opacity="0.7" />
    <circle cx="140" cy="20" r="3" fill="rgba(255,255,255,0.2)" />
    <circle cx="8" cy="96" r="2.5" fill="rgba(255,255,255,0.2)" />
  </svg>
);

// ─── Quick-action cards (shown only when no jobs yet) ──────

const QuickActions = ({ onAddJob, navigate }) => {
  const actions = [
    {
      title: "Upload your CV",
      desc: "Start with your base CV",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#534ab7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" />
        </svg>
      ),
      bg: "bg-brand-50",
      action: () => navigate("/cv"),
    },
    {
      title: "Add a job target",
      desc: "Pick a role to go after",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1d9e75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
        </svg>
      ),
      bg: "bg-teal-50",
      action: onAddJob,
    },
    {
      title: "Decode the job",
      desc: "Uncover what they really need",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef9f27" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      ),
      bg: "bg-amber-50",
      action: () => navigate("/decoder"),
    },
    {
      title: "Write cover letter",
      desc: "AI-powered, voice-matched",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#534ab7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
        </svg>
      ),
      bg: "bg-brand-50",
      action: () => navigate("/cover-letter"),
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {actions.map((a) => (
        <button
          key={a.title}
          onClick={a.action}
          className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 text-left hover:border-brand-200 hover:shadow-md transition-all duration-150 cursor-pointer group"
        >
          <div className={`w-9 h-9 rounded-xl ${a.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-150`}>
            {a.icon}
          </div>
          <p className="text-xs font-semibold text-gray-900 mb-0.5">{a.title}</p>
          <p className="text-xs text-gray-400">{a.desc}</p>
        </button>
      ))}
    </div>
  );
};

// ─── Welcome banner ────────────────────────────────────────

const WelcomeBanner = ({ name, onAddJob }) => (
  <div className="bg-brand-600 rounded-2xl p-5 lg:p-6 text-white mb-6 relative overflow-hidden">
    {/* Background grid pattern */}
    <div className="absolute inset-0 opacity-5 pointer-events-none">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid-dash" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-dash)" />
      </svg>
    </div>

    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex-1">
        <h2 className="text-lg font-semibold mb-1">
          Welcome back{name ? `, ${name.split(" ")[0]}` : ""}! 👋
        </h2>
        <p className="text-brand-200 text-sm">
          Ready to land your next role? Start by adding a job you want to target.
        </p>
      </div>
      <div className="flex items-center gap-4">
        {/* Illustration — hidden on small screens */}
        <div className="hidden sm:block">
          <DashboardIllustration />
        </div>
        <Button
          variant="secondary"
          onClick={onAddJob}
          className="bg-white text-brand-600 hover:bg-brand-50 shrink-0 w-full sm:w-auto"
        >
          + Add role
        </Button>
      </div>
    </div>
  </div>
);

// ─── Dashboard ─────────────────────────────────────────────

const Dashboard = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
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

  const fullName = user?.user_metadata?.full_name || "";

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
        <Button variant="outline" onClick={refetch}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Welcome banner — shown only when no jobs yet */}
      {jobTargets.length === 0 && (
        <WelcomeBanner name={fullName} onAddJob={() => setIsAddJobOpen(true)} />
      )}

      {/* Quick-action cards — shown only when no jobs yet */}
      {jobTargets.length === 0 && (
        <QuickActions
          onAddJob={() => setIsAddJobOpen(true)}
          navigate={navigate}
        />
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
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

      {/* Job targets section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card">
        {/* Section header */}
        <div className="flex items-center justify-between px-4 lg:px-6 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-900">
            Targeted roles
            {jobTargets.length > 0 && (
              <span className="ml-2 text-xs font-normal text-gray-400">
                {jobTargets.length} total
              </span>
            )}
          </h2>
          {jobTargets.length > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddJobOpen(true)}
            >
              + Add role
            </Button>
          )}
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
                  <span className="ml-1.5 text-gray-300">
                    {jobTargets.length}
                  </span>
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
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            }
            title={
              statusFilter === "all"
                ? "No roles added yet"
                : `No ${statusFilter} roles`
            }
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
