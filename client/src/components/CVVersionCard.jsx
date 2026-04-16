import { useNavigate } from "react-router-dom";
import { Badge, MatchScoreRing } from "@/components/ui";

const statusConfig = {
  saved: { label: "Saved", variant: "default" },
  applied: { label: "Applied", variant: "info" },
  interview: { label: "Interview", variant: "success" },
  offer: { label: "Offer", variant: "success" },
  rejected: { label: "Rejected", variant: "danger" },
};

const toneConfig = {
  conservative: { label: "Conservative", color: "text-gray-500 bg-gray-100" },
  balanced: { label: "Balanced", color: "text-brand-700 bg-brand-50" },
  bold: { label: "Bold", color: "text-amber-700 bg-amber-50" },
};

const CVVersionCard = ({ version, onDelete }) => {
  const navigate = useNavigate();
  const tone = toneConfig[version.tone] || toneConfig.balanced;
  const status = statusConfig[version.job_target?.status] || statusConfig.saved;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5 hover:border-gray-200 transition-all duration-150">
      <div className="flex items-start gap-4">
        {/* CV icon */}
        <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center shrink-0">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#534AB7"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {version.version_name}
              </h3>
              {version.job_target && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {version.job_target.job_title} at{" "}
                  {version.job_target.company_name}
                </p>
              )}
            </div>
            <MatchScoreRing score={version.match_score || 0} size="sm" />
          </div>

          {/* Tags */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <Badge variant={status.variant} size="sm">
              {status.label}
            </Badge>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${tone.color}`}
            >
              {tone.label}
            </span>
            {version.ats_score && (
              <span className="text-xs text-gray-400">
                ATS: {version.ats_score}/100
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
        <p className="text-xs text-gray-400">
          {new Date(version.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/cv/${version.id}`)}
            className="text-xs text-brand-600 hover:text-brand-800 font-medium cursor-pointer transition-colors"
          >
            Edit
          </button>
          <span className="text-gray-200">·</span>
          <button
            onClick={() => onDelete(version.id)}
            className="text-xs text-gray-400 hover:text-coral-600 cursor-pointer transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default CVVersionCard;
