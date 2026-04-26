import { useState } from "react";
import { Button, Card, Spinner } from "@/components/ui";
import useJobTargets from "@/hooks/useJobTargets";
import api from "@/lib/api";
import FeatureGate from "@/components/FeatureGate";

// ─── Score ring ────────────────────────────────────────────
const ScoreRing = ({ score }) => {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "#0d9488" : score >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <svg width="72" height="72" viewBox="0 0 72 72" className="shrink-0">
      <circle
        cx="36"
        cy="36"
        r={radius}
        fill="none"
        stroke="#f3f4f6"
        strokeWidth="6"
      />
      <circle
        cx="36"
        cy="36"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 36 36)"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text
        x="36"
        y="36"
        textAnchor="middle"
        dy="0.35em"
        fontSize="14"
        fontWeight="700"
        fill={color}
      >
        {score}
      </text>
    </svg>
  );
};

// ─── Job result card ───────────────────────────────────────
const JobResultCard = ({ result, rank }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4">
      <div className="flex items-center gap-4">
        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-gray-500">#{rank}</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {result.jobTitle}
          </p>
          <p className="text-xs text-gray-400 truncate">{result.company}</p>
        </div>

        <ScoreRing score={result.overall_score || 0} />
      </div>

      {result.verdict && (
        <p className="text-xs text-gray-500 mt-3 leading-relaxed">
          {result.verdict}
        </p>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-brand-600 hover:text-brand-800 mt-2 cursor-pointer"
      >
        {expanded ? "Hide details ▲" : "Show details ▼"}
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {result.quick_wins?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-1">
                Quick wins
              </p>
              <ul className="space-y-1">
                {result.quick_wins.map((win, i) => (
                  <li
                    key={i}
                    className="text-xs text-gray-700 flex items-start gap-1.5"
                  >
                    <span className="text-teal-500 shrink-0 mt-0.5">✓</span>
                    {win}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.top_gaps?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-coral-700 uppercase tracking-wide mb-1">
                Key gaps
              </p>
              <ul className="space-y-1">
                {result.top_gaps.map((gap, i) => (
                  <li
                    key={i}
                    className="text-xs text-gray-700 flex items-start gap-1.5"
                  >
                    <span className="text-coral-400 shrink-0 mt-0.5">✗</span>
                    {gap}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main page ─────────────────────────────────────────────
const SpeedMode = () => {
  const { jobs, isLoading: isLoadingJobs } = useJobTargets();
  const [selected, setSelected] = useState(new Set());
  const [isScoring, setIsScoring] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const toggleJob = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 10) next.add(id);
      return next;
    });
  };

  const handleScore = async () => {
    if (!selected.size) return;
    setError(null);
    setIsScoring(true);
    try {
      const data = await api.post("/bulk/score", {
        jobTargetIds: [...selected],
      });
      setResults(data.results);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsScoring(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setSelected(new Set());
    setError(null);
  };

  return (
    <div className="mx-auto space-y-4">
      <div>
        <h1 className="text-lg font-bold text-gray-900">Speed Mode</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Score your CV against up to 10 jobs at once to find your best matches.
        </p>
      </div>

      {/* Job selector */}
      {!results && (
        <Card padding="md">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">
              Select jobs to score
            </h2>
            <span className="text-xs text-gray-400">
              {selected.size}/10 selected
            </span>
          </div>

          {isLoadingJobs ? (
            <Spinner size="sm" />
          ) : jobs?.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-gray-400">
                No job targets yet. Add jobs from your dashboard first.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {jobs?.map((job) => {
                const isSelected = selected.has(job.id);
                const isDisabled = !isSelected && selected.size >= 10;
                return (
                  <label
                    key={job.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "border-brand-300 bg-brand-50"
                        : isDisabled
                          ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                          : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={isDisabled}
                      onChange={() => toggleJob(job.id)}
                      className="accent-brand-600"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {job.job_title}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {job.company_name}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          <div className="mt-4">
            <Button
              variant="primary"
              fullWidth
              isLoading={isScoring}
              disabled={selected.size === 0}
              onClick={handleScore}
            >
              {isScoring
                ? `Scoring ${selected.size} jobs…`
                : `Score ${selected.size || ""} selected job${selected.size !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </Card>
      )}

      {/* Scoring loading state */}
      {isScoring && (
        <Card padding="md">
          <div className="flex flex-col items-center py-10 gap-4">
            <Spinner size="lg" />
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">
                Scoring {selected.size} jobs…
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Running parallel CV analysis
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Results */}
      {results && !isScoring && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Results — ranked by fit
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {results.length} jobs scored
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset}>
              Score new batch
            </Button>
          </div>

          {results.map((result, i) => (
            <JobResultCard key={result.jobId} result={result} rank={i + 1} />
          ))}
        </div>
      )}

      {error && (
        <div className="bg-coral-50 border border-coral-200 rounded-xl p-3">
          <p className="text-sm text-coral-700">{error}</p>
        </div>
      )}
    </div>
  );
};

const SpeedModeGated = () => (
  <FeatureGate feature="speed_mode"><SpeedMode /></FeatureGate>
);
export default SpeedModeGated;
