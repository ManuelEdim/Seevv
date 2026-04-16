import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MatchScoreRing } from "@/components/ui";
import { supabase } from "@/lib/supabase";

const statusConfig = {
  saved: { label: "Saved", variant: "default" },
  applied: { label: "Applied", variant: "info" },
  interview: { label: "Interview", variant: "success" },
  offer: { label: "Offer", variant: "success" },
  rejected: { label: "Rejected", variant: "danger" },
  withdrawn: { label: "Withdrawn", variant: "default" },
};

const priorityConfig = {
  dream: { label: "Dream role", color: "text-brand-600 bg-brand-50" },
  high: { label: "High priority", color: "text-amber-600 bg-amber-50" },
  medium: { label: "Medium", color: "text-gray-500 bg-gray-100" },
  low: { label: "Low", color: "text-gray-400 bg-gray-50" },
};

const statusOptions = [
  { value: "saved", label: "Saved", color: "text-gray-600" },
  { value: "applied", label: "Applied", color: "text-blue-600" },
  { value: "interview", label: "Interview", color: "text-teal-600" },
  { value: "offer", label: "Offer", color: "text-teal-700" },
  { value: "rejected", label: "Rejected", color: "text-coral-600" },
  { value: "withdrawn", label: "Withdrawn", color: "text-gray-400" },
];

const statusBadgeStyle = (status) => {
  switch (status) {
    case "saved":
      return "bg-gray-100 text-gray-600 border-gray-200";
    case "applied":
      return "bg-blue-50 text-blue-700 border-blue-100";
    case "interview":
      return "bg-teal-50 text-teal-700 border-teal-100";
    case "offer":
      return "bg-teal-50 text-teal-800 border-teal-200";
    case "rejected":
      return "bg-coral-50 text-coral-700 border-coral-100";
    case "withdrawn":
      return "bg-gray-50 text-gray-400 border-gray-100";
    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
};

const JobTargetCard = ({ job, onStatusChange, onDelete }) => {
  const navigate = useNavigate();
  const [currentStatus, setCurrentStatus] = useState(job.status || "saved");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const dropdownRef = useRef(null);

  const priority = priorityConfig[job.priority] || priorityConfig.medium;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleStatusChange = async (newStatus) => {
    if (newStatus === currentStatus) {
      setDropdownOpen(false);
      return;
    }

    const previous = currentStatus;
    setCurrentStatus(newStatus); // optimistic
    setDropdownOpen(false);
    setIsUpdating(true);

    try {
      const { error } = await supabase
        .from("job_targets")
        .update({ status: newStatus })
        .eq("id", job.id);

      if (error) throw error;

      if (onStatusChange) onStatusChange();
    } catch (err) {
      setCurrentStatus(previous); // revert on failure
      console.error("Failed to update status:", err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      className="bg-white rounded-xl border border-gray-100 shadow-card p-5 hover:border-gray-200 hover:shadow-md transition-all duration-150 cursor-pointer"
      onClick={() => navigate(`/decoder?jobId=${job.id}`)}
    >
      <div className="flex items-start gap-4">
        {/* Company avatar */}
        <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
          <span className="text-sm font-semibold text-brand-700">
            {job.company_name?.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Job info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {job.job_title}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {job.company_name}
                {job.location ? ` · ${job.location}` : ""}
                {job.work_type ? ` · ${job.work_type}` : ""}
              </p>
            </div>
            <MatchScoreRing score={job.match_score || 0} size="sm" />
          </div>

          {/* Tags row */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {/* Status badge — clickable dropdown */}
            <div
              className="relative"
              ref={dropdownRef}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setDropdownOpen((p) => !p)}
                className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium border transition-all cursor-pointer ${
                  isUpdating ? "opacity-60" : "hover:opacity-80"
                } ${statusBadgeStyle(currentStatus)}`}
              >
                {isUpdating
                  ? "..."
                  : statusConfig[currentStatus]?.label || "Saved"}
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className={`transition-transform duration-150 ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* Dropdown menu */}
              {dropdownOpen && (
                <div className="absolute left-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-modal z-50 py-1 min-w-[130px]">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleStatusChange(option.value)}
                      className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-2 ${option.color} ${
                        currentStatus === option.value ? "bg-gray-50" : ""
                      }`}
                    >
                      {currentStatus === option.value ? (
                        <span className="text-teal-500">✓</span>
                      ) : (
                        <span className="w-3 inline-block" />
                      )}
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Priority badge */}
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${priority.color}`}
            >
              {priority.label}
            </span>

            {job.salary_range && (
              <span className="text-xs text-gray-400">{job.salary_range}</span>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
        <p className="text-xs text-gray-400">
          Added{" "}
          {new Date(job.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/cv?tailor=${job.id}`);
            }}
            className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
          >
            View CV
          </button>
          <span className="text-gray-200">·</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/decoder?jobId=${job.id}`);
            }}
            className="text-xs text-brand-600 hover:text-brand-800 font-medium cursor-pointer transition-colors"
          >
            Decode
          </button>
          {onDelete && (
            <>
              <span className="text-gray-200">·</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(job.id);
                }}
                className="text-xs text-gray-400 hover:text-coral-600 cursor-pointer transition-colors"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobTargetCard;
