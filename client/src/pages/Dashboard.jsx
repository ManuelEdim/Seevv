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

const WelcomeBanner = ({ name, onAddJob }) => (
  <div className="bg-brand-600 rounded-2xl p-5 lg:p-6 text-white mb-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold mb-1">
          Welcome back{name ? `, ${name.split(" ")[0]}` : ""}
        </h2>
        <p className="text-brand-200 text-sm">
          Ready to land your next role? Start by adding a job you want to
          target.
        </p>
      </div>
      <Button
        variant="secondary"
        onClick={onAddJob}
        className="bg-white text-brand-600 hover:bg-brand-50 flex-shrink-0 w-full sm:w-auto"
      >
        + Add role
      </Button>
    </div>
  </div>
);

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
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#534AB7"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
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
