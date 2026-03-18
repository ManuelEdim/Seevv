const MatchScoreRing = ({ score = 0, size = "md" }) => {
  const sizes = {
    sm: { diameter: 48, stroke: 4, fontSize: "text-xs" },
    md: { diameter: 64, stroke: 5, fontSize: "text-sm" },
    lg: { diameter: 88, stroke: 6, fontSize: "text-base" },
  };

  const { diameter, stroke, fontSize } = sizes[size];
  const radius = (diameter - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color = score >= 80 ? "#1D9E75" : score >= 60 ? "#EF9F27" : "#D85A30";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={diameter} height={diameter} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          fill="none"
          stroke="#F1EFE8"
          strokeWidth={stroke}
        />
        {/* Score ring */}
        <circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      {/* Score text */}
      <span className={`absolute font-semibold ${fontSize}`} style={{ color }}>
        {score}%
      </span>
    </div>
  );
};

export default MatchScoreRing;
