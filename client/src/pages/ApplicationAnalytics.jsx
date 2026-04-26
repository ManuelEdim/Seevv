import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Spinner, Badge } from "@/components/ui";
import api from "@/lib/api";
import FeatureGate from "@/components/FeatureGate";

// ─── Status config ─────────────────────────────────────────
const statusConfig = {
  saved: { label: "Saved", color: "bg-gray-100 text-gray-600" },
  applied: { label: "Applied", color: "bg-brand-50 text-brand-700" },
  interview: { label: "Interview", color: "bg-teal-50 text-teal-700" },
  offer: { label: "Offer", color: "bg-amber-50 text-amber-800" },
  rejected: { label: "Rejected", color: "bg-coral-50 text-coral-700" },
};

// ─── Mini score bar ────────────────────────────────────────
const MiniBar = ({ value, color = "bg-brand-600" }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full ${color} rounded-full`}
        style={{ width: `${value}%` }}
      />
    </div>
    <span className="text-xs font-semibold text-gray-700 w-8 text-right">
      {value}
    </span>
  </div>
);

// ─── Metric tile ───────────────────────────────────────────
const MetricTile = ({ label, value, sub, color = "text-brand-600" }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-card px-5 py-4">
    <p className="text-xs text-gray-400 mb-1">{label}</p>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

// ─── Funnel chart ──────────────────────────────────────────
const Funnel = ({ statusCounts, total }) => {
  const stages = [
    { key: "saved", label: "Saved", color: "bg-gray-200" },
    { key: "applied", label: "Applied", color: "bg-brand-200" },
    { key: "interview", label: "Interview", color: "bg-teal-400" },
    { key: "offer", label: "Offer", color: "bg-amber-400" },
  ];

  return (
    <div className="space-y-2">
      {stages.map(({ key, label, color }) => {
        const count = statusCounts[key] || 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={key} className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-16 shrink-0">{label}</span>
            <div className="flex-1 h-6 bg-gray-50 rounded-lg overflow-hidden">
              <div
                className={`h-full ${color} rounded-lg flex items-center px-2 transition-all duration-700`}
                style={{ width: `${Math.max(pct, 4)}%` }}
              >
                {pct > 8 && (
                  <span className="text-xs font-semibold text-white">
                    {count}
                  </span>
                )}
              </div>
            </div>
            {pct <= 8 && <span className="text-xs text-gray-500">{count}</span>}
          </div>
        );
      })}
    </div>
  );
};

// ─── Version row ───────────────────────────────────────────
const VersionRow = ({ v }) => {
  const sc = statusConfig[v.status] || statusConfig.saved;
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-900 truncate">
          {v.versionName}
        </p>
        <p className="text-xs text-gray-400 truncate">
          {v.jobTitle} · {v.company}
        </p>
      </div>
      <div className="w-32 shrink-0">
        <MiniBar value={v.matchScore} />
      </div>
      <span
        className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${sc.color}`}
      >
        {sc.label}
      </span>
    </div>
  );
};

// ─── Main page ─────────────────────────────────────────────
const ApplicationAnalytics = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [insight, setInsight] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInsighting, setIsInsighting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const d = await api.get("/analytics/applications");
        setData(d);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  const handleInsight = async () => {
    setIsInsighting(true);
    try {
      const d = await api.post("/analytics/insight");
      setInsight(d);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsInsighting(false);
    }
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );

  if (error)
    return (
      <div className="bg-coral-50 border border-coral-200 rounded-xl p-4 max-w-lg mx-auto mt-10">
        <p className="text-sm text-coral-700">{error}</p>
      </div>
    );

  const { versions = [], summary = {} } = data || {};
  const conversionRate =
    summary.total > 0
      ? Math.round(((summary.interviews || 0) / summary.total) * 100)
      : 0;

  return (
    <div className="mx-auto space-y-6 pb-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-gray-900">
            Application Analytics
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Track which CV versions get callbacks and see what's working.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          isLoading={isInsighting}
          disabled={versions.length < 3}
          onClick={handleInsight}
        >
          Get AI insight
        </Button>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricTile
          label="CV versions"
          value={summary.total || 0}
          sub="tailored"
        />
        <MetricTile
          label="Avg match score"
          value={`${summary.avgMatchScore || 0}%`}
          sub="across all versions"
          color="text-brand-600"
        />
        <MetricTile
          label="Interviews"
          value={summary.interviews || 0}
          sub="from applications"
          color="text-teal-600"
        />
        <MetricTile
          label="Interview rate"
          value={`${conversionRate}%`}
          sub="of versions → interview"
          color={conversionRate >= 20 ? "text-teal-600" : "text-amber-600"}
        />
      </div>

      {/* AI insight panel */}
      {insight && (
        <Card padding="md">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-700 mb-4">
            AI pattern insight
          </p>
          <div className="space-y-3">
            {insight.top_performing_pattern && (
              <div className="bg-teal-50 rounded-xl border border-teal-100 p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-teal-700 mb-1">
                  What's working
                </p>
                <p className="text-xs text-teal-900 leading-relaxed">
                  {insight.top_performing_pattern}
                </p>
              </div>
            )}
            {insight.underperforming_pattern && (
              <div className="bg-coral-50 rounded-xl border border-coral-100 p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-coral-700 mb-1">
                  What's not working
                </p>
                <p className="text-xs text-coral-900 leading-relaxed">
                  {insight.underperforming_pattern}
                </p>
              </div>
            )}
            {insight.recommendations?.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Recommendations
                </p>
                <ul className="space-y-1.5">
                  {insight.recommendations.map((r, i) => (
                    <li
                      key={i}
                      className="text-xs text-gray-700 flex items-start gap-2"
                    >
                      <div className="w-4 h-4 rounded-full bg-brand-600 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-white text-[8px] font-bold">
                          {i + 1}
                        </span>
                      </div>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {insight.predicted_best_role_type && (
              <div className="bg-amber-50 rounded-xl border border-amber-100 p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-1">
                  Best role type for you
                </p>
                <p className="text-xs text-amber-900 font-medium">
                  {insight.predicted_best_role_type}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Application funnel */}
        <Card padding="md">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
            Application funnel
          </p>
          {summary.total > 0 ? (
            <Funnel
              statusCounts={summary.statusCounts || {}}
              total={summary.total}
            />
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">
              No applications tracked yet. Start tailoring CVs to job targets.
            </p>
          )}
        </Card>

        {/* Top version */}
        <Card padding="md">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
            Best performing version
          </p>
          {summary.topVersion ? (
            <div className="space-y-3">
              <div className="bg-brand-50 border border-brand-100 rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-900">
                  {summary.topVersion.versionName}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {summary.topVersion.jobTitle} · {summary.topVersion.company}
                </p>
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="font-medium w-24">Match score</span>
                    <MiniBar value={summary.topVersion.matchScore} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="font-medium w-24">ATS score</span>
                    <MiniBar
                      value={summary.topVersion.atsScore}
                      color="bg-teal-400"
                    />
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                fullWidth
                onClick={() => navigate(`/cv/${summary.topVersion.id}`)}
              >
                Open this version →
              </Button>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">
              No versions yet. Tailor a CV from a job target to get started.
            </p>
          )}
        </Card>
      </div>

      {/* All versions table */}
      {versions.length > 0 && (
        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
              All versions
            </p>
            <p className="text-xs text-gray-400">{versions.length} total</p>
          </div>
          <div className="flex items-center gap-3 pb-2 mb-1 border-b border-gray-100 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            <span className="flex-1">Version</span>
            <span className="w-32 shrink-0">Match</span>
            <span className="w-20 shrink-0 text-right">Status</span>
          </div>
          {versions.slice(0, 15).map((v) => (
            <VersionRow key={v.id} v={v} navigate={navigate} />
          ))}
          {versions.length > 15 && (
            <p className="text-xs text-gray-400 text-center pt-3">
              +{versions.length - 15} more versions
            </p>
          )}
        </Card>
      )}

      {versions.length === 0 && !isLoading && (
        <Card padding="md">
          <div className="text-center py-10 space-y-3">
            <div className="text-4xl">📊</div>
            <p className="text-sm font-semibold text-gray-700">No data yet</p>
            <p className="text-xs text-gray-400">
              Tailor CVs to job targets to start tracking your application
              performance.
            </p>
            <Button variant="primary" onClick={() => navigate("/cv")}>
              Go to My CVs
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

const ApplicationAnalyticsGated = () => (
  <FeatureGate feature="analytics"><ApplicationAnalytics /></FeatureGate>
);
export default ApplicationAnalyticsGated;
