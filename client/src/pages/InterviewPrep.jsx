import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button, Card, Spinner } from "@/components/ui";
import useJobTargets from "@/hooks/useJobTargets";
import api from "@/lib/api";

// ─── STAR block ────────────────────────────────────────────
const StarBlock = ({ star }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
    {[
      {
        key: "situation",
        label: "S",
        color: "bg-brand-50 text-brand-800 border-brand-100",
      },
      {
        key: "task",
        label: "T",
        color: "bg-amber-50 text-amber-800 border-amber-100",
      },
      {
        key: "action",
        label: "A",
        color: "bg-teal-50 text-teal-800 border-teal-100",
      },
      {
        key: "result",
        label: "R",
        color: "bg-coral-50 text-coral-800 border-coral-100",
      },
    ].map(({ key, label, color }) => (
      <div key={key} className={`rounded-xl border px-3 py-2.5 ${color}`}>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-1">
          {label} — {key}
        </p>
        <p className="text-xs leading-relaxed">{star[key]}</p>
      </div>
    ))}
  </div>
);

// ─── Question card ─────────────────────────────────────────
const QuestionCard = ({ q, index }) => {
  const [open, setOpen] = useState(index === 0);
  const typeColor =
    {
      behavioural: "bg-brand-50 text-brand-700",
      technical: "bg-teal-50 text-teal-700",
      situational: "bg-amber-50 text-amber-700",
      motivation: "bg-coral-50 text-coral-700",
    }[q.type] || "bg-gray-100 text-gray-600";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-start justify-between gap-3 px-5 py-4 text-left cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-xs font-bold text-white">{index + 1}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 leading-snug">
              {q.question}
            </p>
            <span
              className={`inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeColor}`}
            >
              {q.type}
            </span>
          </div>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-gray-400 shrink-0 mt-1 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-gray-50 pt-4">
          {q.why_theyll_ask && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                Why they'll ask this
              </p>
              <p className="text-xs text-gray-600 leading-relaxed">
                {q.why_theyll_ask}
              </p>
            </div>
          )}

          {q.star_talking_points && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                STAR talking points
              </p>
              <StarBlock star={q.star_talking_points} />
            </div>
          )}

          {q.danger_zone && (
            <div className="bg-coral-50 border border-coral-100 rounded-xl px-3 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-coral-700 mb-1">
                ⚠ Danger zone
              </p>
              <p className="text-xs text-coral-800 leading-relaxed">
                {q.danger_zone}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main page ─────────────────────────────────────────────
const InterviewPrep = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preselected = searchParams.get("jobId");

  const { jobs, isLoading: isLoadingJobs } = useJobTargets();
  const [selectedJobId, setSelectedJobId] = useState(preselected || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [jobMeta, setJobMeta] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    if (!selectedJobId) return;
    setIsGenerating(true);
    setError(null);
    try {
      const data = await api.post("/interview/prep", {
        jobTargetId: selectedJobId,
      });
      setResult(data.result);
      setJobMeta({ title: data.jobTitle, company: data.company });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Interview Prep</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            STAR talking points, likely questions, and smart questions to ask —
            drawn from your actual CV.
          </p>
        </div>
        {result && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/mock-interview?jobId=${selectedJobId}`)}
          >
            Start mock interview →
          </Button>
        )}
      </div>

      {/* Selector */}
      {!result && (
        <Card padding="md">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            Select a job target
          </h2>
          {isLoadingJobs ? (
            <Spinner size="sm" />
          ) : (
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600 mb-4"
            >
              <option value="">Choose a job target…</option>
              {jobs?.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.job_title} — {j.company_name}
                </option>
              ))}
            </select>
          )}
          <Button
            variant="primary"
            fullWidth
            onClick={handleGenerate}
            isLoading={isGenerating}
            disabled={!selectedJobId}
          >
            {isGenerating ? "Generating prep sheet…" : "Generate prep sheet"}
          </Button>
        </Card>
      )}

      {/* Loading */}
      {isGenerating && (
        <Card padding="md">
          <div className="flex flex-col items-center py-10 gap-4">
            <Spinner size="lg" />
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700">
                Building your prep sheet…
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Analysing your CV and the job description to generate
                personalised questions
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Result */}
      {result && !isGenerating && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Prep sheet —{" "}
                <span className="font-normal text-gray-400">
                  {jobMeta?.title} at {jobMeta?.company}
                </span>
              </h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setResult(null)}>
              ← New job
            </Button>
          </div>

          {/* Positioning statement */}
          {result.positioning_statement && (
            <Card padding="md">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                Your "Tell me about yourself" opening
              </p>
              <div className="bg-brand-50 border border-brand-100 rounded-xl p-4">
                <p className="text-sm text-brand-900 leading-relaxed italic">
                  "{result.positioning_statement}"
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() =>
                  navigator.clipboard.writeText(result.positioning_statement)
                }
              >
                Copy
              </Button>
            </Card>
          )}

          {/* Questions */}
          {result.likely_questions?.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                Likely questions ({result.likely_questions.length})
              </p>
              {result.likely_questions.map((q, i) => (
                <QuestionCard key={i} q={q} index={i} />
              ))}
            </div>
          )}

          {/* Three-column supplementals */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {result.company_research_angles?.length > 0 && (
              <Card padding="md">
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-700 mb-3">
                  Research angles
                </p>
                <ul className="space-y-2">
                  {result.company_research_angles.map((a, i) => (
                    <li
                      key={i}
                      className="text-xs text-gray-700 flex items-start gap-1.5"
                    >
                      <span className="text-brand-400 shrink-0 mt-0.5">→</span>
                      {a}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {result.questions_to_ask_them?.length > 0 && (
              <Card padding="md">
                <p className="text-[10px] font-bold uppercase tracking-widest text-teal-700 mb-3">
                  Questions to ask them
                </p>
                <ul className="space-y-2">
                  {result.questions_to_ask_them.map((q, i) => (
                    <li
                      key={i}
                      className="text-xs text-gray-700 flex items-start gap-1.5"
                    >
                      <span className="text-teal-500 shrink-0 mt-0.5">?</span>
                      {q}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {result.watch_out_for?.length > 0 && (
              <Card padding="md">
                <p className="text-[10px] font-bold uppercase tracking-widest text-coral-700 mb-3">
                  Watch out for
                </p>
                <ul className="space-y-2">
                  {result.watch_out_for.map((w, i) => (
                    <li
                      key={i}
                      className="text-xs text-gray-700 flex items-start gap-1.5"
                    >
                      <span className="text-coral-400 shrink-0 mt-0.5">⚠</span>
                      {w}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>

          {/* Start mock interview CTA */}
          <Card padding="md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center shrink-0 text-2xl">
                🎤
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  Ready to practise?
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Run a mock interview with 5 stress-test questions drawn from
                  your CV. Get a readiness score.
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() =>
                  navigate(`/mock-interview?jobId=${selectedJobId}`)
                }
              >
                Start →
              </Button>
            </div>
          </Card>
        </>
      )}

      {error && (
        <div className="bg-coral-50 border border-coral-200 rounded-xl p-3">
          <p className="text-sm text-coral-700">{error}</p>
        </div>
      )}
    </div>
  );
};

export default InterviewPrep;
