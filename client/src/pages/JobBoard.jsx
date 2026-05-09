import { useState, useCallback, useEffect } from "react";
import { useAuthStore } from "@/store";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/context/ToastContext";
import { Spinner } from "@/components/ui";

// ─── External platform search links ───────────────────────

const PLATFORMS = [
  {
    name: "LinkedIn",
    color: "#0077b5",
    bg: "#e8f4fb",
    href: (q, loc) =>
      `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(q)}&location=${encodeURIComponent(loc)}`,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="#0077b5">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" />
      </svg>
    ),
  },
  {
    name: "Indeed",
    color: "#2164f3",
    bg: "#edf1fe",
    href: (q, loc) =>
      `https://www.indeed.com/jobs?q=${encodeURIComponent(q)}&l=${encodeURIComponent(loc)}`,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2164f3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
    ),
  },
  {
    name: "Glassdoor",
    color: "#0caa41",
    bg: "#e6f8ee",
    href: (q, loc) =>
      `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodeURIComponent(q)}&locT=C&locId=0&locKeyword=${encodeURIComponent(loc)}`,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0caa41" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    name: "Otta",
    color: "#ff5a1f",
    bg: "#fff1ec",
    href: (q) =>
      `https://app.otta.com/jobs/search?query=${encodeURIComponent(q)}`,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff5a1f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    name: "We Work Remotely",
    color: "#1d9e75",
    bg: "#e6f9f3",
    href: (q) =>
      `https://weworkremotely.com/remote-jobs/search?term=${encodeURIComponent(q)}`,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1d9e75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
];

const REMOTIVE_CATEGORIES = [
  "All categories",
  "Software Dev",
  "Design",
  "Marketing",
  "Product",
  "Data",
  "DevOps / Sysadmin",
  "Finance / Legal",
  "Customer Support",
  "Sales",
  "Writing",
  "HR",
  "QA",
  "Management",
];

const JOB_TYPES = ["All types", "full_time", "contract", "part_time", "freelance"];
const JOB_TYPE_LABELS = {
  full_time: "Full-time",
  contract: "Contract",
  part_time: "Part-time",
  freelance: "Freelance",
};

// ─── Job card ──────────────────────────────────────────────

const timeAgo = (dateStr) => {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const JobCard = ({ job, onSave, saving }) => {

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-brand-200 transition-all duration-200 p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        {job.company_logo ? (
          <img
            src={job.company_logo}
            alt={job.company_name}
            className="w-10 h-10 rounded-xl object-contain border border-gray-100 bg-white shrink-0"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0 text-brand-600 font-bold text-sm">
            {job.company_name?.[0] || "?"}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 leading-tight truncate">{job.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{job.company_name}</p>
        </div>
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 p-1.5 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-brand-600 transition-colors"
          title="Open original listing"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {job.job_type && (
          <span className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 text-[10px] font-medium">
            {JOB_TYPE_LABELS[job.job_type] || job.job_type}
          </span>
        )}
        {job.candidate_required_location && (
          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-medium truncate max-w-[140px]">
            {job.candidate_required_location}
          </span>
        )}
        {job.category && (
          <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 text-[10px] font-medium">
            {job.category}
          </span>
        )}
      </div>

      {/* Salary if available */}
      {job.salary && (
        <p className="text-[11px] text-gray-500 font-medium">{job.salary}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-1">
        <span className="text-[11px] text-gray-400">{timeAgo(job.publication_date)}</span>
        <button
          onClick={() => onSave(job)}
          disabled={saving === job.id}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-[11px] font-semibold hover:bg-brand-800 transition-colors disabled:opacity-60 cursor-pointer"
        >
          {saving === job.id ? (
            <Spinner size="xs" />
          ) : (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          )}
          Save to tracker
        </button>
      </div>
    </div>
  );
};

// ─── Main component ────────────────────────────────────────

const JobBoard = () => {
  const user = useAuthStore((s) => s.user);
  const { toast } = useToast();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All categories");
  const [jobType, setJobType] = useState("All types");
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [savingId, setSavingId] = useState(null);

  const search = useCallback(async () => {
    setIsLoading(true);
    setHasSearched(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("search", query.trim());
      if (category !== "All categories") params.set("category", category);
      if (jobType !== "All types") params.set("job_type", jobType);
      params.set("limit", "40");

      const res = await fetch(`https://remotive.com/api/remote-jobs?${params}`);
      if (!res.ok) throw new Error("Failed to fetch jobs");
      const { jobs: data } = await res.json();
      setJobs(data || []);
    } catch {
      toast.error("Could not load jobs. Check your connection and try again.");
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  }, [query, category, jobType, toast]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") search();
  };

  // Auto-load on first mount with default (no) filters
  useEffect(() => {
    search();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveToTracker = async (job) => {
    if (!user) return toast.error("Sign in to save jobs.");
    setSavingId(job.id);
    try {
      const { error } = await supabase.from("job_targets").insert({
        user_id: user.id,
        job_title: job.title,
        company_name: job.company_name,
        job_url: job.url,
        status: "saved",
        notes: `Via Seevv Job Board · ${job.candidate_required_location || "Remote"}`,
      });
      if (error) throw error;
      toast.success(`"${job.title}" saved to your tracker.`);
    } catch {
      toast.error("Failed to save job.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-lg font-bold text-gray-900">Job Board</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Browse live remote jobs and save them directly to your tracker.
        </p>
      </div>

      {/* Search bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Job title, keywords..."
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-gray-700"
          >
            {REMOTIVE_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
            className="px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-gray-700"
          >
            {JOB_TYPES.map((t) => (
              <option key={t} value={t}>{JOB_TYPE_LABELS[t] || t}</option>
            ))}
          </select>
          <button
            onClick={search}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-800 transition-colors disabled:opacity-60 cursor-pointer shrink-0"
          >
            {isLoading ? "Searching…" : "Search"}
          </button>
        </div>
      </div>

      {/* Search on other platforms */}
      <div className="mb-6">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
          Also search on
        </p>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <a
              key={p.name}
              href={p.href(query || "software engineer", "")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-100 bg-white text-xs font-semibold text-gray-700 hover:border-gray-200 hover:shadow-sm transition-all"
              style={{ "--p-bg": p.bg }}
            >
              {p.icon}
              {p.name}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          ))}
        </div>
      </div>

      {/* Results */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      )}

      {!isLoading && hasSearched && jobs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-700 mb-1">No jobs found</p>
          <p className="text-xs text-gray-400 max-w-xs">
            Try different keywords or browse one of the platforms above for more results.
          </p>
        </div>
      )}

      {!isLoading && !hasSearched && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#033876" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
              <line x1="12" y1="12" x2="12" y2="16" /><line x1="10" y1="14" x2="14" y2="14" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-700 mb-1">Find your next role</p>
          <p className="text-xs text-gray-400 max-w-xs">
            Search remote jobs above, or use the platform links to browse LinkedIn, Indeed, and more. Save any job directly to your tracker.
          </p>
        </div>
      )}

      {!isLoading && jobs.length > 0 && (
        <>
          <p className="text-xs text-gray-400 mb-4">
            {jobs.length} remote job{jobs.length !== 1 ? "s" : ""} found · powered by{" "}
            <a href="https://remotive.com" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
              Remotive
            </a>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onSave={saveToTracker}
                saving={savingId}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default JobBoard;
