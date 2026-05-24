import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { Spinner } from "@/components/ui";
import FeatureGate from "@/components/FeatureGate";

// ─── Copy button ───────────────────────────────────────────

const CopyButton = ({ text, label = "Copy" }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs text-gray-700 font-medium transition-colors cursor-pointer shrink-0">
      {copied ? "✓ Copied" : label}
    </button>
  );
};

// ─── Expandable Q&A item ───────────────────────────────────

const QAItem = ({ question, answer }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer text-left"
      >
        <p className="text-xs font-semibold text-gray-800">{question}</p>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="px-4 py-3 bg-white flex items-start justify-between gap-3">
          <p className="text-sm text-gray-700 leading-relaxed">{answer}</p>
          <CopyButton text={answer} />
        </div>
      )}
    </div>
  );
};

// ─── Main page ─────────────────────────────────────────────

const ApplyAssist = () => {
  const { toast } = useToast();
  const [jobTargets, setJobTargets] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [manualMode, setManualMode] = useState(false);
  const [form, setForm] = useState({ roleTitle: "", company: "", jobDescription: "", applyUrl: "" });
  const [bundle, setBundle] = useState(null);
  const [coverLetter, setCoverLetter] = useState(null);
  const [applyUrl, setApplyUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(true);

  useEffect(() => {
    api.get("/apply-assist/job-targets")
      .then((d) => setJobTargets(d.jobs || []))
      .catch(() => {})
      .finally(() => setLoadingJobs(false));
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSelectJob = (job) => {
    setSelectedJob(job);
    setForm({ roleTitle: job.role_title, company: job.company, jobDescription: job.job_description, applyUrl: job.apply_url || "" });
    setBundle(null);
    setCoverLetter(null);
  };

  const handleGenerate = async () => {
    const payload = selectedJob
      ? { jobTargetId: selectedJob.id, roleTitle: form.roleTitle, company: form.company, jobDescription: form.jobDescription, applyUrl: form.applyUrl }
      : { roleTitle: form.roleTitle, company: form.company, jobDescription: form.jobDescription, applyUrl: form.applyUrl };

    if (!payload.roleTitle || !payload.jobDescription) {
      return toast.error("Role title and job description are required.");
    }
    setLoading(true);
    try {
      const data = await api.post("/apply-assist/bundle", payload);
      setBundle(data.bundle);
      setCoverLetter(data.coverLetter);
      setApplyUrl(data.applyUrl);
    } catch {
      toast.error("Failed to generate bundle. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLaunch = () => {
    if (applyUrl) window.open(applyUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <FeatureGate feature="apply_assist">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <h1 className="text-lg font-bold text-gray-900">Apply Assist</h1>
          </div>
          <p className="text-sm text-gray-400 ml-10">
            Seevv prepares everything — tailored answers to every screening question, key skills to highlight, ATS keywords, and your cover letter. You control the submit button.
          </p>
        </div>

        {/* Honest disclaimer */}
        <div className="bg-brand-50 border border-brand-100 rounded-xl p-3 mb-6 flex items-start gap-2.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#033876" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p className="text-xs text-brand-800">
            <span className="font-semibold">How this works: </span>
            Seevv generates a complete application package from your CV and the job description. Open the job URL in a new tab, paste the pre-written answers, and submit. Applying takes under 2 minutes.
          </p>
        </div>

        {/* Job selection */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-800">Select a job or enter manually</p>
            <button
              onClick={() => { setManualMode((v) => !v); setSelectedJob(null); setForm({ roleTitle: "", company: "", jobDescription: "", applyUrl: "" }); }}
              className="text-xs text-brand-600 hover:text-brand-800 font-semibold cursor-pointer"
            >
              {manualMode ? "← Use saved jobs" : "Enter manually"}
            </button>
          </div>

          {!manualMode ? (
            loadingJobs ? (
              <div className="flex justify-center py-6"><Spinner size="md" /></div>
            ) : jobTargets.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No job targets with descriptions found. Add roles in your App Tracker or enter a job manually.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {jobTargets.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => handleSelectJob(job)}
                    className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all cursor-pointer ${
                      selectedJob?.id === job.id ? "border-brand-300 bg-brand-50" : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-semibold text-gray-800">{job.role_title}</p>
                      <p className="text-[11px] text-gray-400">{job.company}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      job.status === "applied" ? "bg-brand-100 text-brand-700" :
                      job.status === "saved" ? "bg-gray-100 text-gray-500" :
                      "bg-teal-100 text-teal-700"
                    }`}>{job.status}</span>
                  </button>
                ))}
              </div>
            )
          ) : (
            <div className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Role title *</label>
                  <input value={form.roleTitle} onChange={set("roleTitle")} placeholder="e.g. Marketing Manager" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-brand-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Company</label>
                  <input value={form.company} onChange={set("company")} placeholder="e.g. Paystack" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-brand-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Application URL (optional)</label>
                <input value={form.applyUrl} onChange={set("applyUrl")} placeholder="https://..." className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-brand-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Job description *</label>
                <textarea
                  value={form.jobDescription}
                  onChange={set("jobDescription")}
                  placeholder="Paste the full job description here..."
                  rows={6}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-brand-400 resize-none"
                />
              </div>
            </div>
          )}

          {(selectedJob || manualMode) && (
            <button
              onClick={handleGenerate}
              disabled={loading || (!selectedJob && !form.jobDescription)}
              className="mt-4 w-full py-3 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-800 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? <><Spinner size="sm" /> Preparing your application package…</> : "Generate application package →"}
            </button>
          )}
        </div>

        {/* Bundle results */}
        {bundle && (
          <div className="space-y-4">
            {/* Launch button */}
            {(applyUrl || form.applyUrl || selectedJob?.apply_url) && (
              <button
                onClick={handleLaunch}
                className="w-full py-3 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
                Open application in new tab — then paste your answers below
              </button>
            )}

            {/* Elevator pitch */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Elevator pitch</p>
                <CopyButton text={bundle.elevator_pitch} />
              </div>
              <p className="text-sm text-gray-800 leading-relaxed font-medium">{bundle.elevator_pitch}</p>
            </div>

            {/* Screening Q&A */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50">
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Screening question answers</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Click any question to reveal your tailored answer</p>
              </div>
              <div className="p-4 space-y-2">
                {bundle.screening_answers?.map((qa, i) => (
                  <QAItem key={i} question={qa.question} answer={qa.answer} />
                ))}
              </div>
            </div>

            {/* Cover letter */}
            {coverLetter && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Cover letter</p>
                  <CopyButton text={coverLetter} label="Copy letter" />
                </div>
                <div className="px-4 py-4">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{coverLetter}</p>
                </div>
              </div>
            )}

            {/* Keywords + skills */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">ATS keywords to include</p>
                <div className="flex flex-wrap gap-1.5">
                  {bundle.ats_keywords_to_include?.map((k, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-brand-50 border border-brand-100 text-xs text-brand-700 font-medium">{k}</span>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Key skills to highlight</p>
                <div className="flex flex-wrap gap-1.5">
                  {bundle.key_skills_to_highlight?.map((s, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-100 text-xs text-teal-700 font-medium">{s}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Tips + avoid */}
            <div className="grid sm:grid-cols-2 gap-4">
              {bundle.application_tips?.length > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-amber-700 mb-2">Application tips</p>
                  <ul className="space-y-1.5">
                    {bundle.application_tips.map((t, i) => (
                      <li key={i} className="text-xs text-amber-800 flex items-start gap-1.5"><span className="mt-0.5">→</span>{t}</li>
                    ))}
                  </ul>
                </div>
              )}
              {bundle.things_to_avoid?.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-red-600 mb-2">Avoid these</p>
                  <ul className="space-y-1.5">
                    {bundle.things_to_avoid.map((t, i) => (
                      <li key={i} className="text-xs text-red-700 flex items-start gap-1.5"><span className="mt-0.5">✕</span>{t}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </FeatureGate>
  );
};

export default ApplyAssist;
