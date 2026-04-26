import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, Card, Spinner } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store";
import api from "@/lib/api";
import FeatureGate from "@/components/FeatureGate";

const RecommendationBadge = ({ value }) => {
  const cfg = {
    strong: {
      label: "Strong — Apply now",
      color: "bg-teal-50 text-teal-700 border-teal-200",
    },
    moderate: {
      label: "Moderate — Worth it",
      color: "bg-amber-50 text-amber-700 border-amber-200",
    },
    cautious: {
      label: "Proceed carefully",
      color: "bg-red-50 text-red-600 border-red-200",
    },
  };
  const c = cfg[value] || cfg.moderate;
  return (
    <span
      className={`text-xs font-bold px-3 py-1 rounded-full border ${c.color}`}
    >
      {c.label}
    </span>
  );
};

const SectionBox = ({ title, children, accent = "brand" }) => {
  const colors = {
    brand: "border-brand-100 bg-brand-50",
    teal: "border-teal-100 bg-teal-50",
    amber: "border-amber-100 bg-amber-50",
    red: "border-red-100 bg-red-50",
    gray: "border-gray-100 bg-gray-50",
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[accent]}`}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">
        {title}
      </p>
      {children}
    </div>
  );
};

const CompanyIntelPage = () => {
  const user = useAuthStore((s) => s.user);
  const [searchParams] = useSearchParams();
  const initialJobId = searchParams.get("jobId") || "";

  const [jobs, setJobs] = useState([]);
  const [jobId, setJobId] = useState(initialJobId);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("job_targets")
      .select("id, job_title, company_name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setJobs(data || []));
  }, [user]);

  const handleAnalyse = async () => {
    if (!jobId) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await api.post("/company-intel", { jobTargetId: jobId });
      setResult(data.result);
    } catch (err) {
      setError(err.message || "Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  const intel = result || {};

  return (
    <div className="mx-auto space-y-6 pb-10">
      <div>
        <h1 className="text-lg font-bold text-gray-900">Company Intel</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          AI-powered briefing on the company, culture, and role before you
          apply.
        </p>
      </div>

      <Card padding="md">
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Select job target
            </label>
            <select
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white"
            >
              <option value="">Choose a job target…</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.job_title} — {j.company_name}
                </option>
              ))}
            </select>
          </div>
          <Button
            variant="primary"
            size="sm"
            isLoading={loading}
            disabled={!jobId}
            onClick={handleAnalyse}
          >
            {result ? "Re-analyse" : "Analyse company"}
          </Button>
        </div>
      </Card>

      {loading && (
        <Card padding="md">
          <div className="flex flex-col items-center py-10 gap-4">
            <Spinner size="lg" />
            <p className="text-sm text-gray-500">
              Building your intelligence briefing…
            </p>
          </div>
        </Card>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {result && !loading && (
        <div className="space-y-4">
          {/* Header */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-lg font-bold text-gray-900">
                  {intel.company_summary
                    ? jobs.find((j) => j.id === jobId)?.company_name
                    : "Company"}
                </p>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-lg">
                  {intel.company_summary}
                </p>
              </div>
              {intel.apply_recommendation && (
                <RecommendationBadge value={intel.apply_recommendation} />
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-600">
              {intel.company_stage && (
                <span className="px-2 py-1 bg-gray-100 rounded-full">
                  {intel.company_stage}
                </span>
              )}
              {intel.employee_count_estimate && (
                <span className="px-2 py-1 bg-gray-100 rounded-full">
                  {intel.employee_count_estimate} employees
                </span>
              )}
              {intel.headcount_trend && (
                <span className="px-2 py-1 bg-gray-100 rounded-full">
                  {intel.headcount_trend}
                </span>
              )}
              {intel.glassdoor_sentiment && (
                <span className="px-2 py-1 bg-gray-100 rounded-full">
                  Glassdoor: {intel.glassdoor_sentiment}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Salary */}
            {intel.salary_range && (
              <SectionBox title="Salary estimate" accent="teal">
                <p className="text-lg font-bold text-teal-700">
                  {intel.salary_range}
                </p>
                {intel.salary_note && (
                  <p className="text-xs text-gray-500 mt-1">
                    {intel.salary_note}
                  </p>
                )}
              </SectionBox>
            )}

            {/* Tech stack */}
            {intel.tech_stack?.length > 0 && (
              <SectionBox title="Tech stack" accent="brand">
                <div className="flex flex-wrap gap-1.5">
                  {intel.tech_stack.map((t, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 bg-white border border-brand-200 text-brand-700 rounded-full font-medium"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </SectionBox>
            )}

            {/* Green flags */}
            {intel.green_flags?.length > 0 && (
              <SectionBox title="Green flags" accent="teal">
                <ul className="space-y-1.5">
                  {intel.green_flags.map((f, i) => (
                    <li
                      key={i}
                      className="text-xs text-teal-800 flex items-start gap-2"
                    >
                      <span className="text-teal-500 mt-0.5">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </SectionBox>
            )}

            {/* Red flags */}
            {intel.red_flags?.length > 0 && (
              <SectionBox title="Red flags" accent="red">
                <ul className="space-y-1.5">
                  {intel.red_flags.map((f, i) => (
                    <li
                      key={i}
                      className="text-xs text-red-700 flex items-start gap-2"
                    >
                      <span className="mt-0.5">⚠</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </SectionBox>
            )}

            {/* Culture signals */}
            {intel.culture_signals?.length > 0 && (
              <SectionBox title="Culture signals" accent="amber">
                <div className="flex flex-wrap gap-1.5">
                  {intel.culture_signals.map((s, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 bg-white border border-amber-200 text-amber-700 rounded-full"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </SectionBox>
            )}

            {/* Glassdoor */}
            {intel.glassdoor_summary && (
              <SectionBox title="Employee sentiment" accent="gray">
                <p className="text-xs text-gray-700 leading-relaxed">
                  {intel.glassdoor_summary}
                </p>
              </SectionBox>
            )}
          </div>

          {/* Why apply */}
          {intel.apply_rationale && (
            <SectionBox
              title="Why this recommendation?"
              accent={
                intel.apply_recommendation === "strong"
                  ? "teal"
                  : intel.apply_recommendation === "cautious"
                    ? "red"
                    : "amber"
              }
            >
              <p className="text-sm text-gray-800 leading-relaxed">
                {intel.apply_rationale}
              </p>
            </SectionBox>
          )}

          {/* Prep tips */}
          {intel.prep_tips?.length > 0 && (
            <Card padding="md">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">
                Interview prep tips
              </p>
              <ol className="space-y-3">
                {intel.prep_tips.map((tip, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-xs text-gray-700"
                  >
                    <div className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0 font-bold text-[9px] mt-0.5">
                      {i + 1}
                    </div>
                    <span className="leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ol>
            </Card>
          )}

          {intel.data_note && (
            <p className="text-[10px] text-gray-400 text-center italic">
              {intel.data_note}
            </p>
          )}
        </div>
      )}

      {!result && !loading && (
        <Card padding="md">
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">
              Select a job target above and click "Analyse company" to get your
              briefing.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

const CompanyIntelGated = () => (
  <FeatureGate feature="company_intel">
    <CompanyIntelPage />
  </FeatureGate>
);
export default CompanyIntelGated;
