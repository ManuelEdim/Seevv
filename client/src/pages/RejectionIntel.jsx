import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { Spinner } from "@/components/ui";
import FeatureGate from "@/components/FeatureGate";

// ─── Helpers ───────────────────────────────────────────────

const severityColor = (s) =>
  s === "high" ? "bg-red-100 text-red-700" : s === "medium" ? "bg-amber-100 text-amber-700" : "bg-teal-100 text-teal-700";

const Chip = ({ label, color = "bg-gray-100 text-gray-600" }) => (
  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${color}`}>{label}</span>
);

// ─── Analysis card ─────────────────────────────────────────

const AnalysisCard = ({ job, analysis, onAnalyze, loading }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
    <div className="flex items-start justify-between gap-3 mb-4">
      <div>
        <p className="text-sm font-semibold text-gray-900">{job.role_title}</p>
        <p className="text-xs text-gray-400">{job.company}</p>
      </div>
      <button
        onClick={() => onAnalyze(job.id)}
        disabled={loading}
        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-800 transition-colors disabled:opacity-50 cursor-pointer"
      >
        {loading ? <Spinner size="sm" /> : job.analyzed ? "Re-analyze" : "Analyze"}
      </button>
    </div>

    {analysis ? (
      <div className="space-y-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Likely reasons for rejection</p>
          <ul className="space-y-1.5">
            {analysis.likely_reasons?.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                <span className="mt-0.5 w-4 h-4 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </span>
                {r}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">What to fix next time</p>
          <ul className="space-y-1.5">
            {analysis.what_to_fix?.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                <span className="mt-0.5 w-4 h-4 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {analysis.positioning_advice && (
          <div className="bg-brand-50 border border-brand-100 rounded-xl p-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-brand-600 mb-1">Positioning advice</p>
            <p className="text-xs text-brand-800 leading-relaxed">{analysis.positioning_advice}</p>
          </div>
        )}

        {analysis.silver_linings?.length > 0 && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Silver linings</p>
            <div className="flex flex-wrap gap-2">
              {analysis.silver_linings.map((s, i) => <Chip key={i} label={s} color="bg-teal-50 text-teal-700" />)}
            </div>
          </div>
        )}
      </div>
    ) : (
      <p className="text-xs text-gray-400 italic">Click "Analyze" to get AI-powered rejection feedback for this role.</p>
    )}
  </div>
);

// ─── Pattern dashboard ──────────────────────────────────────

const PatternDashboard = ({ patterns, count }) => {
  if (!patterns) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
          </svg>
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-900">Rejection Patterns</h2>
          <p className="text-[11px] text-gray-400">Based on {count} analyzed rejections</p>
        </div>
      </div>

      {patterns.root_cause && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-red-600 mb-1">Root cause</p>
          <p className="text-xs text-red-800 leading-relaxed">{patterns.root_cause}</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        {patterns.top_patterns?.map((p, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
            <span className={`mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${severityColor(p.severity)}`}>
              {p.severity?.toUpperCase()}
            </span>
            <div>
              <p className="text-xs font-semibold text-gray-800">{p.pattern}</p>
              <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{p.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Priority actions</p>
        <ol className="space-y-2">
          {patterns.priority_actions?.map((a, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs text-gray-700">
              <span className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</span>
              {a}
            </li>
          ))}
        </ol>
      </div>

      {patterns.quick_wins?.length > 0 && (
        <div className="mb-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Quick wins this week</p>
          <div className="flex flex-wrap gap-2">
            {patterns.quick_wins.map((w, i) => <Chip key={i} label={w} color="bg-amber-50 text-amber-700" />)}
          </div>
        </div>
      )}

      {patterns.encouraging_note && (
        <div className="bg-teal-50 border border-teal-100 rounded-xl p-3">
          <p className="text-xs text-teal-800 leading-relaxed">{patterns.encouraging_note}</p>
          {patterns.estimated_timeline && (
            <p className="text-[11px] text-teal-600 mt-1 font-medium">⏱ {patterns.estimated_timeline}</p>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main page ─────────────────────────────────────────────

const RejectionIntel = () => {
  const { toast } = useToast();
  const [jobs, setJobs] = useState([]);
  const [analyses, setAnalyses] = useState({});
  const [patterns, setPatterns] = useState(null);
  const [patternCount, setPatternCount] = useState(0);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(null);
  const [loadingPatterns, setLoadingPatterns] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.get("/rejection-intel/list");
        setJobs(data.jobs || []);
      } catch {
        toast.error("Failed to load rejected jobs.");
      } finally {
        setLoadingJobs(false);
      }
    };
    load();
  }, []);

  const handleAnalyze = async (jobTargetId) => {
    setLoadingAnalysis(jobTargetId);
    try {
      const data = await api.post("/rejection-intel/analyze", { jobTargetId });
      setAnalyses((prev) => ({ ...prev, [jobTargetId]: data.analysis }));
      setJobs((prev) => prev.map((j) => j.id === jobTargetId ? { ...j, analyzed: true } : j));
      toast.success("Analysis complete.");
    } catch {
      toast.error("Analysis failed. Please try again.");
    } finally {
      setLoadingAnalysis(null);
    }
  };

  const handleLoadPatterns = async () => {
    setLoadingPatterns(true);
    try {
      const data = await api.get("/rejection-intel/patterns");
      if (data.patterns) {
        setPatterns(data.patterns);
        setPatternCount(data.count);
      } else {
        toast.info(data.message || "Not enough analyzed rejections yet.");
      }
    } catch {
      toast.error("Failed to load patterns.");
    } finally {
      setLoadingPatterns(false);
    }
  };

  const analyzedCount = jobs.filter((j) => j.analyzed).length;

  return (
    <FeatureGate feature="rejection_intel">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h1 className="text-lg font-bold text-gray-900">Rejection Intelligence</h1>
          </div>
          <p className="text-sm text-gray-400 ml-10">
            Turn every rejection into learnable data. AI analyzes why applications fell short and spots patterns across all your rejections.
          </p>
        </div>

        {/* Pattern trigger */}
        {analyzedCount >= 2 && (
          <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4 mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-brand-800">{analyzedCount} rejections analyzed</p>
              <p className="text-xs text-brand-600">You have enough data for pattern detection.</p>
            </div>
            <button
              onClick={handleLoadPatterns}
              disabled={loadingPatterns}
              className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loadingPatterns ? <Spinner size="sm" /> : "Detect patterns"}
            </button>
          </div>
        )}

        {/* Pattern results */}
        {patterns && <PatternDashboard patterns={patterns} count={patternCount} />}

        {/* Rejected jobs list */}
        {loadingJobs ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 14s-1 0-1-1V7a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H9z"/><path d="M5 10H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1"/>
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">No rejected roles yet</p>
            <p className="text-xs text-gray-400 max-w-xs">Mark a job as "Rejected" in your App Tracker to analyze what went wrong.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{jobs.length} rejected role{jobs.length !== 1 ? "s" : ""}</p>
            {jobs.map((job) => (
              <AnalysisCard
                key={job.id}
                job={job}
                analysis={analyses[job.id]}
                onAnalyze={handleAnalyze}
                loading={loadingAnalysis === job.id}
              />
            ))}
          </div>
        )}
      </div>
    </FeatureGate>
  );
};

export default RejectionIntel;
