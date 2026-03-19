import { useNavigate } from "react-router-dom";
import { Badge, MatchScoreRing } from "@/components/ui";

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

const JobTargetCard = ({ job, onStatusChange }) => {
  const navigate = useNavigate();
  const status = statusConfig[job.status] || statusConfig.saved;
  const priority = priorityConfig[job.priority] || priorityConfig.medium;

  return (
    <div
      className="bg-white rounded-xl border border-gray-100 shadow-card p-5 hover:border-gray-200 hover:shadow-md transition-all duration-150 cursor-pointer"
      onClick={() => navigate(`/decoder?jobId=${job.id}`)}
    >
      <div className="flex items-start gap-4">
        {/* Company avatar */}
        <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
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
            {/* Match score ring */}
            <MatchScoreRing score={job.match_score || 0} size="sm" />
          </div>

          {/* Tags row */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <Badge variant={status.variant} size="sm">
              {status.label}
            </Badge>
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
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/cv?jobId=${job.id}`);
            }}
            className="text-xs text-brand-600 hover:text-brand-800 font-medium cursor-pointer transition-colors"
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
        </div>
      </div>
    </div>
  );
};

export default JobTargetCard;
