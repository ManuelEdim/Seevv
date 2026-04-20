import { useState } from "react";
import { Button, Card, Spinner } from "@/components/ui";
import api from "@/lib/api";
import useJobTargets from "@/hooks/useJobTargets";

const COMMON_INDUSTRIES = [
  "Finance", "Technology", "Healthcare", "Marketing", "Education",
  "Consulting", "Law", "Engineering", "Product Management", "Operations",
  "Sales", "Design", "Non-profit", "Government",
];

const strengthColor = {
  strong: "bg-teal-50 text-teal-800 border-teal-200",
  moderate: "bg-amber-50 text-amber-800 border-amber-200",
  weak: "bg-coral-50 text-coral-800 border-coral-200",
};

// ─── Analysis result view ──────────────────────────────────
const TransitionAnalysis = ({ result, onRewrite, isRewriting }) => (
  <div className="space-y-4">
    {/* Readiness summary */}
    <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-brand-800 uppercase tracking-wide">
          Transition readiness
        </p>
        <span className="text-2xl font-bold text-brand-700">
          {result.readiness_score ?? "—"}
          <span className="text-sm font-normal text-brand-500">/100</span>
        </span>
      </div>
      <p className="text-sm text-brand-900 leading-relaxed">
        {result.transition_narrative || result.summary}
      </p>
    </div>

    {/* Recommended positioning */}
    {result.recommended_positioning && (
      <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
          How to position yourself
        </p>
        <p className="text-sm text-gray-700">{result.recommended_positioning}</p>
      </div>
    )}

    {/* Transferable skills */}
    {result.transferable_skills?.length > 0 && (
      <div>
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
          Transferable skills
        </p>
        <div className="space-y-2">
          {result.transferable_skills.map((skill, i) => (
            <div
              key={i}
              className={`rounded-xl border px-3 py-2.5 ${
                strengthColor[skill.strength] || strengthColor.moderate
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{skill.skill}</p>
                <span className="text-xs font-semibold capitalize shrink-0">
                  {skill.strength}
                </span>
              </div>
              {(skill.origin_term || skill.target_term) && (
                <p className="text-xs opacity-70 mt-1">
                  {skill.origin_term} → {skill.target_term}
                </p>
              )}
              {skill.evidence && (
                <p className="text-xs opacity-60 mt-0.5 italic">{skill.evidence}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Vocabulary map — API returns array */}
    {result.vocabulary_map?.length > 0 && (
      <div>
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
          Language bridge (old → new industry terms)
        </p>
        <div className="bg-gray-50 rounded-xl border border-gray-100 divide-y divide-gray-100">
          {result.vocabulary_map.map((item, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-2.5">
              <span className="text-sm text-gray-500 line-through flex-1">
                {item.origin_phrase}
              </span>
              <span className="text-gray-300 shrink-0">→</span>
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900">
                  {item.target_phrase}
                </span>
                {item.rationale && (
                  <p className="text-xs text-gray-400 mt-0.5">{item.rationale}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Key gaps */}
    {(result.key_gaps || result.gaps_to_address)?.length > 0 && (
      <div>
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
          Gaps to address
        </p>
        <ul className="space-y-1">
          {(result.key_gaps || result.gaps_to_address).map((g, i) => (
            <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
              <span className="text-coral-400 mt-0.5 shrink-0">✗</span>
              {g}
            </li>
          ))}
        </ul>
      </div>
    )}

    {/* Quick wins / action plan */}
    {(result.quick_wins || result.action_plan)?.length > 0 && (
      <div className="bg-amber-50 rounded-xl border border-amber-100 p-4">
        <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-3">
          Quick wins to strengthen candidacy
        </p>
        <div className="space-y-2">
          {(result.quick_wins || result.action_plan).map((step, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">{i + 1}</span>
              </div>
              <p className="text-sm text-amber-900">{step}</p>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Rewrite CV button */}
    {result.vocabulary_map?.length > 0 && (
      <Button
        variant="primary"
        fullWidth
        isLoading={isRewriting}
        onClick={() => onRewrite(result.vocabulary_map)}
      >
        {isRewriting ? "Rewriting CV…" : "Rewrite my CV for this industry →"}
      </Button>
    )}
  </div>
);

// ─── Rewritten CV view — backend returns plain text ────────
const RewrittenCV = ({ text, onBack }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <p className="text-sm font-semibold text-gray-900">Rewritten CV</p>
      <button
        onClick={onBack}
        className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
      >
        ← Back
      </button>
    </div>

    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <pre className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">
        {text}
      </pre>
    </div>

    <Button
      variant="outline"
      fullWidth
      onClick={() => navigator.clipboard.writeText(text)}
    >
      Copy rewritten CV
    </Button>
  </div>
);

// ─── Main page ─────────────────────────────────────────────
const TransitionMode = () => {
  const { jobs } = useJobTargets();
  const [originIndustry, setOriginIndustry] = useState("");
  const [targetIndustry, setTargetIndustry] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [customOrigin, setCustomOrigin] = useState("");
  const [customTarget, setCustomTarget] = useState("");

  const [step, setStep] = useState("form");
  const [analysis, setAnalysis] = useState(null);
  const [rewritten, setRewritten] = useState(null);
  const [error, setError] = useState(null);

  const origin = originIndustry === "__custom__" ? customOrigin : originIndustry;
  const target = targetIndustry === "__custom__" ? customTarget : targetIndustry;

  const handleAnalyze = async () => {
    if (!origin || !target) return;
    setError(null);
    setStep("analyzing");
    try {
      const data = await api.post("/transition/analyze", {
        originIndustry: origin,
        targetIndustry: target,
        jobTargetId: selectedJobId || undefined,
      });
      setAnalysis(data);
      setStep("result");
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setStep("form");
    }
  };

  const handleRewrite = async (vocabularyMap) => {
    setError(null);
    setStep("rewriting");
    try {
      const data = await api.post("/transition/rewrite", {
        vocabularyMap,
        targetRole: analysis?.recommended_positioning || target,
        targetIndustry: target,
      });
      // Backend returns plain text wrapped in { rewrittenCV: "..." }
      setRewritten(typeof data === "string" ? data : data.rewrittenCV || JSON.stringify(data));
      setStep("rewritten");
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setStep("result");
    }
  };

  return (
    <div className="mx-auto space-y-4">
      <div>
        <h1 className="text-lg font-bold text-gray-900">Industry Transition Mode</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Bridge the language gap between industries and get your CV rewritten for a new sector.
        </p>
      </div>

      {/* Form */}
      {step === "form" && (
        <Card padding="md">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Where you're coming from
              </label>
              <select
                value={originIndustry}
                onChange={(e) => setOriginIndustry(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600"
              >
                <option value="">Select your current industry…</option>
                {COMMON_INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
                <option value="__custom__">Other (type below)</option>
              </select>
              {originIndustry === "__custom__" && (
                <input
                  type="text"
                  value={customOrigin}
                  onChange={(e) => setCustomOrigin(e.target.value)}
                  placeholder="e.g. Retail, Logistics…"
                  className="mt-2 w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Where you want to go
              </label>
              <select
                value={targetIndustry}
                onChange={(e) => setTargetIndustry(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600"
              >
                <option value="">Select your target industry…</option>
                {COMMON_INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
                <option value="__custom__">Other (type below)</option>
              </select>
              {targetIndustry === "__custom__" && (
                <input
                  type="text"
                  value={customTarget}
                  onChange={(e) => setCustomTarget(e.target.value)}
                  placeholder="e.g. Fintech, Climate tech…"
                  className="mt-2 w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Target job (optional — improves analysis)
              </label>
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600"
              >
                <option value="">No specific job (general analysis)</option>
                {jobs?.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.job_title} — {j.company_name}
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="primary"
              fullWidth
              onClick={handleAnalyze}
              disabled={!origin || !target}
            >
              Analyse my transition
            </Button>
          </div>
        </Card>
      )}

      {/* Analyzing */}
      {step === "analyzing" && (
        <Card padding="md">
          <div className="flex flex-col items-center py-10 gap-4">
            <Spinner size="lg" />
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">Mapping your transition…</p>
              <p className="text-xs text-gray-400 mt-1">
                Identifying transferable skills and vocabulary bridges
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Results */}
      {step === "result" && analysis && (
        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">
              {origin} → {target}
            </h2>
            <button
              onClick={() => setStep("form")}
              className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              ← Start over
            </button>
          </div>
          <TransitionAnalysis
            result={analysis}
            onRewrite={handleRewrite}
            isRewriting={step === "rewriting"}
          />
        </Card>
      )}

      {/* Rewriting */}
      {step === "rewriting" && (
        <Card padding="md">
          <div className="flex flex-col items-center py-10 gap-4">
            <Spinner size="lg" />
            <p className="text-sm text-gray-500">Rewriting your CV for {target}…</p>
          </div>
        </Card>
      )}

      {/* Rewritten CV */}
      {step === "rewritten" && rewritten && (
        <Card padding="md">
          <RewrittenCV text={rewritten} onBack={() => setStep("result")} />
        </Card>
      )}

      {error && (
        <div className="bg-coral-50 border border-coral-200 rounded-xl p-3">
          <p className="text-sm text-coral-700">{error}</p>
        </div>
      )}
    </div>
  );
};

export default TransitionMode;
