import { useNavigate } from "react-router-dom";
import useFeatureAccess from "@/hooks/useFeatureAccess";

// Wraps any page/section — shows an upgrade wall if the user lacks the feature
const FeatureGate = ({ feature, children }) => {
  const { allowed, requiredLabel } = useFeatureAccess(feature);
  const navigate = useNavigate();

  if (allowed) return children;

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-5">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#033876" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
      <h2 className="text-base font-bold text-gray-900 mb-2">
        {requiredLabel} plan required
      </h2>
      <p className="text-sm text-gray-400 max-w-sm mb-6">
        This feature is available on the <span className="font-semibold text-gray-600">{requiredLabel}</span> plan and above.
        Upgrade to unlock it.
      </p>
      <button
        onClick={() => navigate("/pricing")}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-800 transition-colors cursor-pointer"
      >
        View plans & upgrade
      </button>
    </div>
  );
};

export default FeatureGate;
