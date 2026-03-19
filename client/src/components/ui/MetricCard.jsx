const MetricCard = ({ label, value, sub, color = "brand" }) => {
  const colors = {
    brand: "text-brand-600",
    teal: "text-teal-400",
    amber: "text-amber-400",
    coral: "text-coral-400",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-card">
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">
        {label}
      </p>
      <p className={`text-3xl font-semibold ${colors[color]}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
};

export default MetricCard;
