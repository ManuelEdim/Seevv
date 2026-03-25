const SuccessBanner = ({ isVisible, title, description, icon }) => {
  if (!isVisible) return null;

  return (
    <div className="animate-slide-down">
      <div className="flex items-start gap-3 bg-teal-50 border border-teal-200 rounded-xl px-4 py-3">
        {/* Animated checkmark */}
        <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          {icon || (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1D9E75"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-teal-900">{title}</p>
          {description && (
            <p className="text-xs text-teal-700 mt-0.5">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuccessBanner;
