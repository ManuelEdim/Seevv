import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store";
import { Button, Spinner, Card } from "@/components/ui";
import { useToast } from "@/context/ToastContext";
import api from "@/lib/api";

const COLUMNS = [
  { key: "saved",     label: "Saved",     color: "border-gray-200 bg-gray-50",     dot: "bg-gray-400",     text: "text-gray-600" },
  { key: "applied",   label: "Applied",   color: "border-brand-200 bg-brand-50",   dot: "bg-brand-500",   text: "text-brand-700" },
  { key: "interview", label: "Interview", color: "border-teal-200 bg-teal-50",     dot: "bg-teal-500",    text: "text-teal-700" },
  { key: "offer",     label: "Offer",     color: "border-amber-200 bg-amber-50",   dot: "bg-amber-500",   text: "text-amber-700" },
  { key: "rejected",  label: "Rejected",  color: "border-red-100 bg-red-50",       dot: "bg-red-400",     text: "text-red-600" },
];

const statusConfig = Object.fromEntries(COLUMNS.map((c) => [c.key, c]));

// ─── Job card ──────────────────────────────────────────────
const JobCard = ({ job, onStatusChange, onOpen }) => {
  const [moving, setMoving] = useState(false);
  const cfg = statusConfig[job.status || "saved"];

  const handleMove = async (newStatus) => {
    setMoving(true);
    await onStatusChange(job.id, newStatus);
    setMoving(false);
  };

  const nextStatus = {
    saved:     "applied",
    applied:   "interview",
    interview: "offer",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 space-y-2 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-gray-900 truncate">{job.job_title}</p>
          <p className="text-xs text-gray-400 truncate">{job.company_name}</p>
        </div>
        <button
          onClick={() => onOpen(job)}
          className="shrink-0 text-gray-300 hover:text-gray-600 cursor-pointer transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
          </svg>
        </button>
      </div>

      {job.notes && (
        <p className="text-[10px] text-gray-400 italic leading-relaxed line-clamp-2">{job.notes}</p>
      )}

      {job.applied_at && (
        <p className="text-[10px] text-gray-400">
          Applied {new Date(job.applied_at).toLocaleDateString()}
        </p>
      )}

      {nextStatus[job.status] && (
        <button
          onClick={() => handleMove(nextStatus[job.status])}
          disabled={moving}
          className={`w-full text-[10px] font-semibold py-1.5 rounded-lg border cursor-pointer transition-all ${cfg.color} ${cfg.text} hover:opacity-80 disabled:opacity-40`}
        >
          {moving ? "Moving…" : `→ Mark as ${statusConfig[nextStatus[job.status]]?.label}`}
        </button>
      )}
    </div>
  );
};

// ─── Detail modal ──────────────────────────────────────────
const JobDetailModal = ({ job, onClose, onStatusChange, navigate }) => {
  const [notes, setNotes] = useState(job.notes || "");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(job.status || "saved");
  const [interviewDate, setInterviewDate] = useState(job.interview_date ? job.interview_date.slice(0, 16) : "");
  const [contactName, setContactName] = useState(job.contact_name || "");
  const [contactEmail, setContactEmail] = useState(job.contact_email || "");
  const [salaryDiscussed, setSalaryDiscussed] = useState(job.salary_discussed || "");

  const handleSave = async () => {
    setSaving(true);
    await onStatusChange(job.id, status, notes, {
      interview_date: interviewDate || null,
      contact_name: contactName,
      contact_email: contactEmail,
      salary_discussed: salaryDiscussed,
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-4">
          <div>
            <p className="font-bold text-gray-900">{job.job_title}</p>
            <p className="text-xs text-gray-400">{job.company_name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Status */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Status</p>
            <div className="grid grid-cols-3 gap-2">
              {COLUMNS.map((col) => (
                <button key={col.key} onClick={() => setStatus(col.key)}
                  className={`text-xs font-semibold py-2 px-2 rounded-xl border-2 transition-all cursor-pointer ${
                    status === col.key ? "border-brand-600 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >{col.label}</button>
              ))}
            </div>
          </div>

          {/* Interview date */}
          {(status === "interview" || status === "offer" || interviewDate) && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Interview date & time</p>
              <input
                type="datetime-local"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600"
              />
            </div>
          )}

          {/* Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Contact name</p>
              <input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Hiring manager"
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600"
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Salary discussed</p>
              <input
                value={salaryDiscussed}
                onChange={(e) => setSalaryDiscussed(e.target.value)}
                placeholder="e.g. £60k"
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Notes</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Additional notes…"
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button variant="outline" size="sm" fullWidth onClick={() => navigate(`/decoder?jobId=${job.id}`)}>
              Open in Decoder →
            </Button>
            <Button variant="outline" size="sm" fullWidth onClick={() => navigate(`/cover-letter?jobId=${job.id}`)}>
              Write Cover Letter →
            </Button>
            <Button variant="outline" size="sm" fullWidth onClick={() => navigate(`/company-intel?jobId=${job.id}`)}>
              Company Intel →
            </Button>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-800 cursor-pointer disabled:opacity-50"
          >{saving ? "Saving…" : "Save"}</button>
          <button onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-gray-600 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer"
          >Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ─── Main page ─────────────────────────────────────────────
const ApplicationTracker = () => {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openJob, setOpenJob] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  const PAGE_SIZE = 100;

  const loadJobs = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from("job_targets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE + 1);
      if (err) throw err;
      const fetched = data || [];
      setHasMore(fetched.length > PAGE_SIZE);
      setJobs(fetched.slice(0, PAGE_SIZE));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  const handleStatusChange = async (id, status, notes, extra = {}) => {
    setError(null);
    try {
      await api.patch(`/jobs/${id}/status`, { status, ...(notes !== undefined && { notes }), ...extra });
      setJobs((prev) => prev.map((j) => j.id === id ? { ...j, status, ...(notes !== undefined && { notes }), ...extra, ...(status === "applied" && { applied_at: new Date().toISOString() }) } : j));
      toast.success("Application updated.");
    } catch (err) {
      setError(err.message);
    }
  };

  const byStatus = Object.fromEntries(COLUMNS.map((c) => [c.key, jobs.filter((j) => (j.status || "saved") === c.key)]));
  const total = jobs.length;
  const interviewRate = total > 0 ? Math.round(((byStatus.interview?.length + byStatus.offer?.length) / total) * 100) : 0;

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Application Tracker</h1>
          <p className="text-xs text-gray-400 mt-0.5">Track every application through the pipeline.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => navigate("/dashboard")}>
          + Add job target
        </Button>
      </div>

      {error && <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-600">{error}</div>}

      {/* Pipeline stats */}
      {total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {COLUMNS.map((col) => (
            <div key={col.key} className={`rounded-xl border p-3 text-center ${col.color}`}>
              <p className={`text-2xl font-bold ${col.text}`}>{byStatus[col.key]?.length || 0}</p>
              <p className={`text-[10px] font-semibold uppercase tracking-widest mt-0.5 ${col.text}`}>{col.label}</p>
            </div>
          ))}
        </div>
      )}

      {total > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 px-5 py-3 flex items-center gap-4 flex-wrap">
          <span className="text-xs text-gray-500">{total} total applications</span>
          <span className="text-xs text-gray-300">·</span>
          <span className="text-xs text-teal-700 font-semibold">{interviewRate}% interview rate</span>
          {byStatus.offer?.length > 0 && (
            <>
              <span className="text-xs text-gray-300">·</span>
              <span className="text-xs text-amber-700 font-semibold">{byStatus.offer.length} offer{byStatus.offer.length !== 1 ? "s" : ""}</span>
            </>
          )}
        </div>
      )}

      {hasMore && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 text-xs text-amber-800">
          Showing your most recent 100 applications. Archive older roles to keep this list manageable.
        </div>
      )}

      {/* Kanban board */}
      {total === 0 ? (
        <Card padding="md">
          <div className="text-center py-10">
            <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#033876" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">No applications tracked yet</p>
            <p className="text-xs text-gray-400 mb-5">Add job targets from the dashboard to start tracking.</p>
            <Button variant="primary" onClick={() => navigate("/dashboard")}>Add your first job →</Button>
          </div>
        </Card>
      ) : (
        <div className="overflow-x-auto -mx-4 px-4 pb-2">
          <div className="flex gap-4 min-w-max lg:min-w-0 lg:grid lg:grid-cols-5">
            {COLUMNS.map((col) => (
              <div key={col.key} className="flex flex-col gap-3 min-h-32 w-64 lg:w-auto shrink-0">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${col.color}`}>
                  <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                  <span className={`text-xs font-bold uppercase tracking-widest ${col.text}`}>{col.label}</span>
                  <span className={`ml-auto text-xs font-semibold ${col.text}`}>{byStatus[col.key]?.length || 0}</span>
                </div>
                {byStatus[col.key]?.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onStatusChange={(id, status) => handleStatusChange(id, status)}
                    onOpen={setOpenJob}
                  />
                ))}
                {byStatus[col.key]?.length === 0 && (
                  <div className="border-2 border-dashed border-gray-100 rounded-xl py-6 text-center">
                    <p className="text-[10px] text-gray-300">None</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {openJob && (
        <JobDetailModal
          job={openJob}
          onClose={() => setOpenJob(null)}
          onStatusChange={handleStatusChange}
          navigate={navigate}
        />
      )}
    </div>
  );
};

export default ApplicationTracker;
