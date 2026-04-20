import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, Card, Spinner, Badge } from "@/components/ui";
import useJobTargets from "@/hooks/useJobTargets";
import api from "@/lib/api";

// ─── Step 1: Analysis result ──────────────────────────────
const GapAnalysis = ({ analysis, jobTitle, company, onGenerateProjects }) => {
  const skills = analysis?.skills || [];
  const summary = analysis?.summary || {};

  const greenSkills = skills.filter((s) => s.status === "green");
  const gapSkills = skills.filter((s) => s.status === "amber" || s.status === "red");

  const statusColor = {
    green: "bg-teal-50 border-teal-100 text-teal-800",
    amber: "bg-amber-50 border-amber-100 text-amber-800",
    red: "bg-coral-50 border-coral-100 text-coral-800",
  };

  return (
    <div className="space-y-4">
      <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4">
        <p className="text-xs font-semibold text-brand-800 uppercase tracking-wide mb-1">Role</p>
        <p className="text-sm font-medium text-gray-900">
          {jobTitle} — {company}
        </p>
        <div className="flex gap-4 mt-3">
          <div className="text-center">
            <p className="text-lg font-bold text-teal-600">{summary.green_count ?? greenSkills.length}</p>
            <p className="text-xs text-gray-500">Strong</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-amber-600">{summary.amber_count ?? skills.filter((s) => s.status === "amber").length}</p>
            <p className="text-xs text-gray-500">Partial</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-coral-600">{summary.red_count ?? skills.filter((s) => s.status === "red").length}</p>
            <p className="text-xs text-gray-500">Missing</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-brand-700">{summary.overall_readiness ?? 0}%</p>
            <p className="text-xs text-gray-500">Readiness</p>
          </div>
        </div>
      </div>

      {/* All skills */}
      <div className="space-y-2">
        {skills.map((s, i) => (
          <div key={i} className={`rounded-xl border px-3 py-2.5 ${statusColor[s.status] || statusColor.amber}`}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">{s.skill}</p>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold">{s.closeness_score}%</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                  s.status === "green" ? "bg-teal-100 text-teal-700" :
                  s.status === "amber" ? "bg-amber-100 text-amber-700" :
                  "bg-coral-100 text-coral-700"
                }`}>{s.status}</span>
              </div>
            </div>
            {s.demonstrated && (
              <p className="text-xs opacity-70 mt-1">✓ {s.demonstrated}</p>
            )}
            {s.gap && (
              <p className="text-xs opacity-70 mt-1">✗ {s.gap}</p>
            )}
          </div>
        ))}
      </div>

      {gapSkills.length > 0 && (
        <Button
          variant="primary"
          fullWidth
          onClick={() => onGenerateProjects(gapSkills)}
        >
          Generate micro-projects for {gapSkills.length} gaps →
        </Button>
      )}
    </div>
  );
};

// ─── Step 2: Micro-projects ────────────────────────────────
const MicroProjects = ({ projects, onCVUpdate }) => (
  <div className="space-y-4">
    <p className="text-xs text-gray-400">
      Complete these projects to fill your skill gaps and strengthen your CV.
    </p>
    {projects?.map((p, i) => (
      <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">{p.project_title || p.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{p.description}</p>
          </div>
          {p.difficulty && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border shrink-0 ${
              p.difficulty === "beginner" ? "bg-teal-50 text-teal-700 border-teal-100" :
              p.difficulty === "advanced" ? "bg-coral-50 text-coral-700 border-coral-100" :
              "bg-amber-50 text-amber-700 border-amber-100"
            }`}>{p.difficulty}</span>
          )}
        </div>

        {p.portfolio_output && (
          <div className="bg-gray-50 rounded-lg px-3 py-2">
            <p className="text-xs text-gray-400 mb-0.5">Portfolio output</p>
            <p className="text-xs text-gray-700">{p.portfolio_output}</p>
          </div>
        )}

        {p.cv_bullet_template && (
          <div className="bg-brand-50 rounded-lg px-3 py-2">
            <p className="text-xs text-brand-600 mb-0.5">CV bullet template</p>
            <p className="text-xs text-brand-900 italic">{p.cv_bullet_template}</p>
          </div>
        )}

        {p.time_estimate && (
          <p className="text-xs text-gray-400">⏱ {p.time_estimate}</p>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onCVUpdate({ title: p.project_title || p.title, description: p.description })}
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
      <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer">
        Close
      </button>
    </div>
    <div className="bg-white rounded-xl border border-teal-200 p-3">
      <p className="text-sm text-gray-900 leading-relaxed">{bullet.bullet}</p>
    </div>
    {bullet.section && (
      <p className="text-xs text-teal-700">
        Add to: <span className="font-medium">{bullet.section}</span>
      </p>
    )}
    {bullet.rationale && (
      <p className="text-xs text-gray-500 italic">{bullet.rationale}</p>
    )}
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

  const [step, setStep] = useState("select");
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
      const data = await api.post("/gap-roadmap/analyze", { jobTargetId: selectedJobId });
      setAnalysis(data.analysis);
      setAnalysisJob({ title: data.jobTitle, company: data.company });
      setStep("analysis");
    } catch (err) {
      setError(err.response?.data?.error || err.message);
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
      setProjects(data.projects || (Array.isArray(data) ? data : []));
      setStep("projects");
    } catch (err) {
      setError(err.response?.data?.error || err.message);
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
      setError(err.response?.data?.error || err.message);
      setStep("projects");
    }
  };

  return (
    <div className="mx-auto space-y-4">
      <div>
        <h1 className="text-lg font-bold text-gray-900">Gap-to-Goal Roadmap</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Identify skill gaps and get a personalised project roadmap to close them.
        </p>
      </div>

      {/* Step 1: Job selector */}
      {(step === "select" || step === "analyzing") && (
        <Card padding="md">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Select a job target</h2>
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

      {/* Loading */}
      {(step === "generating" || step === "cv-updating") && (
        <Card padding="md">
          <div className="flex flex-col items-center py-8 gap-4">
            <Spinner size="lg" />
            <p className="text-sm text-gray-500">
              {step === "generating" ? "Generating personalised micro-projects…" : "Crafting your CV bullet…"}
            </p>
          </div>
        </Card>
      )}

      {/* Step 2: Gap analysis results */}
      {step === "analysis" && analysis && (
        <Card padding="md">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Skill gap analysis</h2>
          <GapAnalysis
            analysis={analysis}
            jobTitle={analysisJob?.title}
            company={analysisJob?.company}
            onGenerateProjects={handleGenerateProjects}
          />
        </Card>
      )}

      {/* Step 3: Micro-projects */}
      {(step === "projects" || step === "cv-updating" || step === "cv-done") && projects && (
        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Your micro-project roadmap</h2>
            <button
              onClick={() => setStep("analysis")}
              className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              ← Back to analysis
            </button>
          </div>
          {cvBullet && step === "cv-done" && (
            <div className="mb-4">
              <CVBulletPanel bullet={cvBullet} onClose={() => setStep("projects")} />
            </div>
          )}
          <MicroProjects
            projects={Array.isArray(projects) ? projects : []}
            onCVUpdate={handleCVUpdate}
          />
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

export default GapRoadmap;
