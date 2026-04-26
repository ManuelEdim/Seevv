import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, Badge, Spinner, Card } from "@/components/ui";
import useDecoder from "@/hooks/useDecoder";
import api from "@/lib/api";

const urgencyColors = {
  high: "danger",
  medium: "warning",
  low: "success",
};

const statusConfig = {
  met: { label: "Met", color: "bg-teal-50 text-teal-800", icon: "✓" },
  partial: { label: "Partial", color: "bg-amber-50 text-amber-800", icon: "~" },
  gap: { label: "Gap", color: "bg-coral-50 text-coral-800", icon: "✗" },
};

const signalTypeColors = {
  urgency: "bg-amber-50 text-amber-800 border-amber-200",
  pain: "bg-coral-50 text-coral-800 border-coral-200",
  structure: "bg-brand-50 text-brand-800 border-brand-200",
};

// ─── Tab components ───────────────────────────────────────

const HiddenNeedTab = ({ result }) => (
  <div className="space-y-4">
    <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
          What they actually need
        </p>
        <Badge variant="warning">
          {result.hidden_need_confidence} confidence
        </Badge>
      </div>
      <p className="text-sm text-amber-900 leading-relaxed">
        {result.hidden_need}
      </p>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <p className="text-xs text-gray-400 mb-1">Culture tone</p>
        <p className="text-sm font-medium text-gray-900">
          {result.culture_tone}
        </p>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <p className="text-xs text-gray-400 mb-1">Urgency level</p>
        <div className="flex items-center gap-2">
          <Badge variant={urgencyColors[result.urgency_level]}>
            {result.urgency_level}
          </Badge>
        </div>
      </div>
    </div>

    <div className="bg-brand-50 rounded-xl border border-brand-100 p-4">
      <p className="text-xs font-semibold text-brand-800 uppercase tracking-wide mb-3">
        How to position your CV
      </p>
      <div className="space-y-2">
        {result.positioning_advice.map((advice, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">{i + 1}</span>
            </div>
            <p className="text-sm text-brand-900">{advice}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const SignalsTab = ({ result }) => (
  <div className="space-y-3">
    <p className="text-xs text-gray-400">
      These phrases in the JD triggered the hidden need analysis.
    </p>
    {result.signals.map((signal, i) => (
      <div
        key={i}
        className={`rounded-xl border p-4 ${signalTypeColors[signal.type]}`}
      >
        <div className="flex items-center justify-between mb-2">
          <code className="text-xs font-mono font-semibold bg-white/60 px-2 py-0.5 rounded">
            "{signal.phrase}"
          </code>
          <span className="text-xs font-medium capitalize px-2 py-0.5 rounded-full bg-white/60">
            {signal.type}
          </span>
        </div>
        <p className="text-sm">{signal.interpretation}</p>
      </div>
    ))}
  </div>
);

const RequirementsTab = ({ result }) => (
  <div className="space-y-2">
    <div className="flex gap-3 mb-4">
      {["met", "partial", "gap"].map((status) => {
        const count = result.requirements.filter(
          (r) => r.status === status,
        ).length;
        const config = statusConfig[status];
        return (
          <div
            key={status}
            className={`flex-1 rounded-lg px-3 py-2 text-center ${config.color}`}
          >
            <p className="text-lg font-semibold">{count}</p>
            <p className="text-xs">{config.label}</p>
          </div>
        );
      })}
    </div>

    {result.requirements.map((req, i) => {
      const config = statusConfig[req.status];
      return (
        <div
          key={i}
          className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100"
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${config.color}`}
          >
            {config.icon}
          </div>
          <p className="text-sm text-gray-700 flex-1">{req.text}</p>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.color}`}
          >
            {config.label}
          </span>
        </div>
      );
    })}
  </div>
);

const KeywordsTab = ({ result }) => (
  <div className="space-y-3">
    <p className="text-xs text-gray-400">
      These keywords will trigger ATS matching for this role. Ensure they appear
      naturally in your CV.
    </p>
    {result.ats_keywords.map((kw, i) => (
      <div
        key={i}
        className="flex items-center gap-3 bg-white rounded-lg border border-gray-100 p-3"
      >
        <div className="w-6 h-6 rounded-full bg-brand-50 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-brand-700">{i + 1}</span>
        </div>
        <p className="text-sm font-medium text-gray-900 flex-1 capitalize">
          {kw.keyword}
        </p>
        <div className="flex items-center gap-2 w-32">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-600 rounded-full transition-all duration-500"
              style={{ width: `${kw.weight}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 w-8 text-right">
            {kw.weight}%
          </span>
        </div>
      </div>
    ))}
  </div>
);

// ─── Company Intelligence tab ─────────────────────────────

const CompanyIntelTab = ({ jobId }) => {
  const [intelData, setIntelData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFetch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.post("/company-intel", { jobTargetId: jobId });
      setIntelData(data.result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!jobId) {
    return (
      <p className="text-sm text-gray-400 text-center py-6">
        Company intelligence is only available when decoding from a saved job target.
      </p>
    );
  }

  if (!intelData && !isLoading) {
    return (
      <div className="text-center py-6 space-y-3">
        <p className="text-sm text-gray-500">
          Get deep intelligence on this company — culture signals, growth stage, interview style, and more.
        </p>
        <Button variant="primary" onClick={handleFetch}>
          Analyse company
        </Button>
        {error && <p className="text-xs text-coral-600">{error}</p>}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center py-8 gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-gray-400">Gathering company intelligence…</p>
      </div>
    );
  }

  const r = intelData;
  return (
    <div className="space-y-4">
      {r.summary && (
        <div className="bg-brand-50 border border-brand-100 rounded-xl p-4">
          <p className="text-xs font-semibold text-brand-800 uppercase tracking-wide mb-1">
            Company snapshot
          </p>
          <p className="text-sm text-brand-900 leading-relaxed">{r.summary}</p>
        </div>
      )}

      {r.culture_signals?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
            Culture signals
          </p>
          <div className="flex flex-wrap gap-2">
            {r.culture_signals.map((s, i) => (
              <span
                key={i}
                className="text-xs px-2.5 py-1 bg-teal-50 text-teal-800 rounded-full border border-teal-100 font-medium"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {r.interview_style && (
        <div className="bg-amber-50 rounded-xl border border-amber-100 p-4">
          <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">
            Interview style
          </p>
          <p className="text-sm text-amber-900">{r.interview_style}</p>
        </div>
      )}

      {r.growth_stage && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl border border-gray-100 p-3">
            <p className="text-xs text-gray-400 mb-0.5">Growth stage</p>
            <p className="text-sm font-medium text-gray-900">{r.growth_stage}</p>
          </div>
          {r.likely_team_size && (
            <div className="bg-white rounded-xl border border-gray-100 p-3">
              <p className="text-xs text-gray-400 mb-0.5">Team size</p>
              <p className="text-sm font-medium text-gray-900">{r.likely_team_size}</p>
            </div>
          )}
        </div>
      )}

      {r.red_flags?.length > 0 && (
        <div className="bg-coral-50 rounded-xl border border-coral-100 p-4">
          <p className="text-xs font-semibold text-coral-800 uppercase tracking-wide mb-2">
            Watch out for
          </p>
          <ul className="space-y-1">
            {r.red_flags.map((flag, i) => (
              <li key={i} className="text-sm text-coral-900 flex items-start gap-2">
                <span className="text-coral-400 shrink-0 mt-0.5">⚠</span>
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {r.positioning_tips?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
            How to position yourself
          </p>
          <div className="space-y-2">
            {r.positioning_tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">{i + 1}</span>
                </div>
                <p className="text-sm text-gray-700">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button variant="outline" size="sm" onClick={handleFetch}>
        Re-analyse
      </Button>
    </div>
  );
};

// ─── Main Decoder page ────────────────────────────────────

const tabs = [
  { id: "hidden-need", label: "Hidden need" },
  { id: "signals", label: "Signals" },
  { id: "requirements", label: "Requirements" },
  { id: "keywords", label: "ATS keywords" },
  { id: "company-intel", label: "Company intel" },
];

const Decoder = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get("jobId");
  const [jdText, setJdText] = useState("");
  const [isTailoring, setIsTailoring] = useState(false);

  const {
    job,
    decoderResult,
    isLoadingJob,
    isDecoding,
    activeTab,
    setActiveTab,
    error,
    runDecoder,
  } = useDecoder();

  const handleDecode = () => {
    const text = job?.job_description || jdText;
    if (!text.trim()) return;
    runDecoder(text, jobId || null);
  };

  const handleTailorCV = () => {
    if (!jobId) return;
    setIsTailoring(true);
    navigate(`/cv?tailor=${jobId}`);
  };

  if (isLoadingJob) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-4">
      {/* JD Input section */}
      {!decoderResult && (
        <Card padding="md">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">
            {job
              ? `Decoding: ${job.job_title} at ${job.company_name}`
              : "Paste a job description"}
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            {job
              ? "The job description from your target is ready to decode."
              : "Paste any job description and Seevv will decode what the company actually needs."}
          </p>

          {!job && (
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste the full job description here — the more detail, the better the analysis..."
              rows={8}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent resize-none placeholder:text-gray-400 mb-4"
            />
          )}

          {job && (
            <div className="bg-gray-50 rounded-lg p-3 mb-4 max-h-40 overflow-y-auto">
              <p className="text-xs text-gray-500 leading-relaxed">
                {job.job_description}
              </p>
            </div>
          )}

          <Button
            variant="primary"
            onClick={handleDecode}
            isLoading={isDecoding}
            disabled={!job && !jdText.trim()}
            fullWidth
          >
            {isDecoding ? "Decoding..." : "Run Deep Decoder"}
          </Button>
        </Card>
      )}

      {/* Decoding loading state */}
      {isDecoding && (
        <Card padding="md">
          <div className="flex flex-col items-center py-8 gap-4">
            <Spinner size="lg" />
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700 mb-1">
                Analysing the job description...
              </p>
              <p className="text-xs text-gray-400">
                Extracting signals, decoding requirements, and identifying the
                hidden need
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Results */}
      {decoderResult && !isDecoding && (
        <div className="space-y-4">
          {/* Result header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Decoder results
                {job && (
                  <span className="text-gray-400 font-normal ml-1">
                    — {job.job_title} at {job.company_name}
                  </span>
                )}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Click any tab to explore the full analysis
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => runDecoder(job?.job_description || jdText, jobId)}
            >
              Re-run
            </Button>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
            <div className="flex border-b border-gray-100 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-4 py-3 text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? "text-brand-700 border-b-2 border-brand-600 bg-brand-50"
                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-4 lg:p-5">
              {activeTab === "hidden-need" && (
                <HiddenNeedTab result={decoderResult} />
              )}
              {activeTab === "signals" && <SignalsTab result={decoderResult} />}
              {activeTab === "requirements" && (
                <RequirementsTab result={decoderResult} />
              )}
              {activeTab === "keywords" && (
                <KeywordsTab result={decoderResult} />
              )}
              {activeTab === "company-intel" && (
                <CompanyIntelTab jobId={jobId} />
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="primary"
              fullWidth
              isLoading={isTailoring}
              onClick={handleTailorCV}
            >
              Tailor my CV for this role →
            </Button>
            <Button
              variant="outline"
              fullWidth
              onClick={() => navigate(`/cover-letter?jobId=${jobId}`)}
            >
              Generate cover letter
            </Button>
          </div>
          {jobId && (
            <Button
              variant="ghost"
              fullWidth
              onClick={() => navigate(`/gap-roadmap?jobId=${jobId}`)}
            >
              View skill gap roadmap →
            </Button>
          )}
        </div>
      )}

      {/* Error state */}
      {error && (
        <Card padding="md">
          <div className="text-center py-4">
            <p className="text-sm text-coral-600 mb-3">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try again
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Decoder;
