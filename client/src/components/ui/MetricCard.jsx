const MetricCard = ({ label, value, sub, color = "brand", tooltip }) => {
  const colors = {
    brand: "text-brand-600",
    teal: "text-teal-400",
    amber: "text-amber-400",
    coral: "text-coral-400",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-card">
      <div className="flex items-center gap-1 mb-2">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
          {label}
        </p>
        {tooltip && (
          <div className="relative group">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="cursor-help">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-44 bg-gray-900 text-white text-[11px] leading-snug rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
              {tooltip}
              <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900" />
            </div>
          </div>
        )}
      </div>
      <p className={`text-3xl font-semibold ${colors[color]}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
};

export default MetricCard;
