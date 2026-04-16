import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, Card, Spinner, Badge } from "@/components/ui";
import useJobTargets from "@/hooks/useJobTargets";
import api from "@/lib/api";

// ─── Difficulty badge ─────────────────────────────────────
const diffColor = { easy: "success", medium: "warning", hard: "danger" };

// ─── Step 1: Analysis result ──────────────────────────────
const GapAnalysis = ({ analysis, jobTitle, company, onGenerateProjects }) => (
  <div className="space-y-4">
    <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4">
      <p className="text-xs font-semibold text-brand-800 uppercase tracking-wide mb-1">
        Role
      </p>
      <p className="text-sm font-medium text-gray-900">
        {jobTitle} — {company}
      </p>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div className="bg-teal-50 rounded-xl border border-teal-100 p-4">
        <p className="text-xs text-teal-700 font-semibold uppercase tracking-wide mb-2">
          Strengths
        </p>
        <ul className="space-y-1">
          {analysis.strengths?.map((s, i) => (
            <li
              key={i}
              className="text-sm text-teal-900 flex items-start gap-1.5"
            >
              <span className="text-teal-500 mt-0.5">✓</span>
              {s}
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-coral-50 rounded-xl border border-coral-100 p-4">
        <p className="text-xs text-coral-700 font-semibold uppercase tracking-wide mb-2">
          Gaps
        </p>
        <ul className="space-y-1">
          {analysis.gaps?.map((g, i) => (
            <li
              key={i}
              className="text-sm text-coral-900 flex items-start gap-1.5"
            >
              <span className="text-coral-500 mt-0.5">✗</span>
              {g}
            </li>
          ))}
        </ul>
      </div>
    </div>

    {analysis.recommendations && (
      <div className="bg-amber-50 rounded-xl border border-amber-100 p-4">
        <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-2">
          Recommendations
        </p>
        <ul className="space-y-1">
          {analysis.recommendations.map((r, i) => (
            <li key={i} className="text-sm text-amber-900">
              {i + 1}. {r}
            </li>
          ))}
        </ul>
      </div>
    )}

    <Button
      variant="primary"
      fullWidth
      onClick={() => onGenerateProjects(analysis.gaps || [])}
    >
      Generate micro-projects for these gaps →
    </Button>
  </div>
);

// ─── Step 2: Micro-projects ────────────────────────────────
const MicroProjects = ({ projects, onCVUpdate }) => (
  <div className="space-y-4">
    <p className="text-xs text-gray-400">
      Complete these projects to fill your skill gaps and strengthen your CV.
    </p>
    {projects?.map((p, i) => (
      <div
        key={i}
        className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 space-y-3"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-gray-900">{p.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{p.description}</p>
          </div>
          <Badge variant={diffColor[p.difficulty] || "default"}>
            {p.difficulty}
          </Badge>
        </div>

        {p.skills_gained?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {p.skills_gained.map((s, j) => (
              <span
                key={j}
                className="text-xs px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full font-medium"
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {p.deliverable && (
          <div className="bg-gray-50 rounded-lg px-3 py-2">
            <p className="text-xs text-gray-400 mb-0.5">Deliverable</p>
            <p className="text-xs text-gray-700">{p.deliverable}</p>
          </div>
        )}

        {p.time_estimate && (
          <p className="text-xs text-gray-400">⏱ {p.time_estimate}</p>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            onCVUpdate({ title: p.title, description: p.description })
          }
        >
          Get CV bullet for this project
        </Button>
      </div>
    ))}
  </div>
);

// ─── Step 3: CV bullet suggestion ─────────────────────────
const CVBulletPanel = ({ bullet, onClose }) => (
  <div className="bg-teal-50 rounded-2xl border border-teal-100 p-4 space-y-3">
    <div className="flex items-center justify-between">
      <p className="text-xs font-semibold text-teal-800 uppercase tracking-wide">
        Suggested CV bullet
      </p>
      <button
        onClick={onClose}
        className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
      >
        Close
      </button>
    </div>
    <div className="bg-white rounded-xl border border-teal-200 p-3">
      <p className="text-sm text-gray-900 leading-relaxed">{bullet.bullet}</p>
    </div>
    {bullet.section_suggestion && (
      <p className="text-xs text-teal-700">
        Add to: <span className="font-medium">{bullet.section_suggestion}</span>
      </p>
    )}
    {bullet.tip && <p className="text-xs text-gray-500 italic">{bullet.tip}</p>}
    <Button
      variant="ghost"
      size="sm"
      onClick={() => navigator.clipboard.writeText(bullet.bullet)}
    >
      Copy to clipboard
    </Button>
  </div>
);

// ─── Main page ─────────────────────────────────────────────
const GapRoadmap = () => {
  const [searchParams] = useSearchParams();
  const preselectedJobId = searchParams.get("jobId");

  const { jobs, isLoading: isLoadingJobs } = useJobTargets();
  const [selectedJobId, setSelectedJobId] = useState(preselectedJobId || "");

  const [step, setStep] = useState("select"); // select | analyzing | analysis | generating | projects | cv-updating | cv-done
  const [analysis, setAnalysis] = useState(null);
  const [analysisJob, setAnalysisJob] = useState(null);
  const [projects, setProjects] = useState(null);
  const [cvBullet, setCvBullet] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    if (!selectedJobId) return;
    setError(null);
    setStep("analyzing");
    try {
      const data = await api.post("/gap-roadmap/analyze", {
        jobTargetId: selectedJobId,
      });
      setAnalysis(data.analysis);
      setAnalysisJob({ title: data.jobTitle, company: data.company });
      setStep("analysis");
    } catch (err) {
      setError(err.message);
      setStep("select");
    }
  };

  const handleGenerateProjects = async (gapSkills) => {
    setError(null);
    setStep("generating");
    try {
      const data = await api.post("/gap-roadmap/micro-projects", {
        gapSkills,
        jobTargetId: selectedJobId,
      });
      setProjects(data.projects || data);
      setStep("projects");
    } catch (err) {
      setError(err.message);
      setStep("analysis");
    }
  };

  const handleCVUpdate = async ({ title, description }) => {
    setError(null);
    setCvBullet(null);
    setStep("cv-updating");
    try {
      const data = await api.post("/gap-roadmap/cv-update", {
        projectTitle: title,
        projectDescription: description,
        targetRole: analysisJob?.title,
      });
      setCvBullet(data);
      setStep("cv-done");
    } catch (err) {
      setError(err.message);
      setStep("projects");
    }
  };

  const isLoading = ["analyzing", "generating", "cv-updating"].includes(step);

  return (
    <div className="mx-auto space-y-4">
      <div>
        <h1 className="text-lg font-bold text-gray-900">Gap-to-Goal Roadmap</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Identify skill gaps and get a personalised project roadmap to close
          them.
        </p>
      </div>

      {/* Step 1: Job selector */}
      {(step === "select" || step === "analyzing") && (
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
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent mb-4"
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
            onClick={handleAnalyze}
            isLoading={step === "analyzing"}
            disabled={!selectedJobId}
          >
            {step === "analyzing" ? "Analysing gaps…" : "Analyse skill gaps"}
          </Button>
        </Card>
      )}

      {/* Generating / loading states */}
      {(step === "generating" || step === "cv-updating") && (
        <Card padding="md">
          <div className="flex flex-col items-center py-8 gap-4">
            <Spinner size="lg" />
            <p className="text-sm text-gray-500">
              {step === "generating"
                ? "Generating personalised micro-projects…"
                : "Crafting your CV bullet…"}
            </p>
          </div>
        </Card>
      )}

      {/* Step 2: Gap analysis results */}
      {step === "analysis" && analysis && (
        <Card padding="md">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            Skill gap analysis
          </h2>
          <GapAnalysis
            analysis={analysis}
            jobTitle={analysisJob?.title}
            company={analysisJob?.company}
            onGenerateProjects={handleGenerateProjects}
          />
        </Card>
      )}

      {/* Step 3: Micro-projects */}
      {(step === "projects" || step === "cv-updating" || step === "cv-done") &&
        projects && (
          <Card padding="md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">
                Your micro-project roadmap
              </h2>
              <button
                onClick={() => setStep("analysis")}
                className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                ← Back to analysis
              </button>
            </div>
            {cvBullet && step === "cv-done" && (
              <div className="mb-4">
                <CVBulletPanel
                  bullet={cvBullet}
                  onClose={() => setStep("projects")}
                />
              </div>
            )}
            <MicroProjects
              projects={
                Array.isArray(projects) ? projects : projects?.projects || []
              }
              onCVUpdate={handleCVUpdate}
            />
          </Card>
        )}

      {/* Error */}
      {error && (
        <div className="bg-coral-50 border border-coral-200 rounded-xl p-3">
          <p className="text-sm text-coral-700">{error}</p>
        </div>
      )}
    </div>
  );
};

export default GapRoadmap;
