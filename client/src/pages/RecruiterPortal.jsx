import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store";
import { supabase } from "@/lib/supabase";
import api from "@/lib/api";
import { Spinner } from "@/components/ui";

// ─── Country labels ────────────────────────────────────────
const COUNTRY_LABELS = {
  NG: "Nigeria", GH: "Ghana", KE: "Kenya", ZA: "South Africa",
  ET: "Ethiopia", TZ: "Tanzania", UG: "Uganda", RW: "Rwanda",
  SN: "Senegal", CI: "Côte d'Ivoire", GB: "United Kingdom",
  US: "United States", CA: "Canada", AU: "Australia",
  DE: "Germany", FR: "France", NL: "Netherlands", AE: "UAE",
};

// ─── Score badge ───────────────────────────────────────────
const ScoreBadge = ({ score }) => {
  if (!score) return <span className="text-xs text-gray-300">—</span>;
  const color = score >= 70 ? "text-teal-700 bg-teal-50" : score >= 50 ? "text-amber-700 bg-amber-50" : "text-coral-700 bg-coral-50";
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>{score}</span>;
};

// ─── Stat tile ─────────────────────────────────────────────
const StatTile = ({ label, value, sub }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
    <p className="text-xs text-gray-400 mb-1">{label}</p>
    <p className="text-2xl font-bold text-gray-900">{value ?? "—"}</p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

// ─── Skill bar (mini) ──────────────────────────────────────
const MiniBar = ({ score }) => (
  <div className="flex items-center gap-2 w-full">
    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full bg-brand-500 rounded-full" style={{ width: `${score}%` }} />
    </div>
    <span className="text-[10px] text-gray-400 w-6 text-right">{score}</span>
  </div>
);

// ─────────────────────────────────────────────────────────────
//  VIEW: Overview (platform stats)
// ─────────────────────────────────────────────────────────────
const OverviewView = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get("/recruiter/platform-stats")
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  if (error) return <div className="bg-coral-50 border border-coral-200 rounded-xl p-4"><p className="text-sm text-coral-700">{error}</p></div>;

  const funnel = [
    { label: "Saved", count: stats.statusCounts?.saved || 0, color: "bg-gray-300" },
    { label: "Applied", count: stats.statusCounts?.applied || 0, color: "bg-brand-400" },
    { label: "Interview", count: stats.statusCounts?.interview || 0, color: "bg-teal-400" },
    { label: "Offer", count: stats.statusCounts?.offer || 0, color: "bg-teal-600" },
    { label: "Rejected", count: stats.statusCounts?.rejected || 0, color: "bg-coral-400" },
  ];
  const maxCount = Math.max(...funnel.map((f) => f.count), 1);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-gray-900">Platform overview</h2>
        <p className="text-xs text-gray-400 mt-0.5">Live stats across all Seevv candidates</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Registered candidates" value={stats.totalUsers?.toLocaleString()} />
        <StatTile label="Active CVs" value={stats.totalActiveCVs?.toLocaleString()} />
        <StatTile label="Avg CV match score" value={stats.avgPlatformScore} sub="across all applications" />
        <StatTile label="Platform interview rate" value={`${stats.interviewRate}%`} sub={`${stats.interviews} interviews · ${stats.offers} offers`} />
      </div>

      {/* Application funnel */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Application funnel</p>
        <div className="space-y-3">
          {funnel.map((f) => (
            <div key={f.label} className="flex items-center gap-3">
              <p className="text-xs text-gray-500 w-20 shrink-0">{f.label}</p>
              <div className="flex-1 h-6 bg-gray-50 rounded-lg overflow-hidden">
                <div
                  className={`h-full rounded-lg ${f.color} transition-all duration-700`}
                  style={{ width: `${(f.count / maxCount) * 100}%`, minWidth: f.count ? 24 : 0 }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-700 w-12 text-right">{f.count.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  VIEW: Candidate list
// ─────────────────────────────────────────────────────────────
const CandidatesView = ({ onViewCandidate, onSelectForRank, selectedForRank }) => {
  const [candidates, setCandidates] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [sortBy, setSortBy] = useState("joined"); // joined | score | interviews

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (countryFilter) params.set("country", countryFilter);
      const data = await api.get(`/recruiter/candidates?${params}`);
      setCandidates(data.candidates || []);
      setTotal(data.total || 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [search, countryFilter]);

  useEffect(() => { load(); }, [load]);

  const sorted = [...candidates].sort((a, b) => {
    if (sortBy === "score") return b.avgMatchScore - a.avgMatchScore;
    if (sortBy === "interviews") return b.interviewCount - a.interviewCount;
    return new Date(b.joinedAt) - new Date(a.joinedAt);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-gray-900">Candidates</h2>
          <p className="text-xs text-gray-400 mt-0.5">{total} registered</p>
        </div>
        {selectedForRank.size > 0 && (
          <div className="flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-xl px-3 py-2">
            <p className="text-xs text-brand-700 font-medium">{selectedForRank.size} selected for ranking</p>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name…"
          className="px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600 w-48"
        />
        <select
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600"
        >
          <option value="">All countries</option>
          {Object.entries(COUNTRY_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600"
        >
          <option value="joined">Sort: Newest</option>
          <option value="score">Sort: Best match score</option>
          <option value="interviews">Sort: Most interviews</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : error ? (
        <div className="bg-coral-50 border border-coral-200 rounded-xl p-4"><p className="text-sm text-coral-700">{error}</p></div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-12 text-sm text-gray-400">No candidates found.</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            <div className="col-span-1" />
            <div className="col-span-3">Candidate</div>
            <div className="col-span-2">Country</div>
            <div className="col-span-1 text-center">CVs</div>
            <div className="col-span-2 text-center">Avg score</div>
            <div className="col-span-1 text-center">Interviews</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {sorted.map((c, i) => {
            const isSelected = selectedForRank.has(c.id);
            const canSelect = isSelected || selectedForRank.size < 5;

            return (
              <div
                key={c.id}
                className={`grid grid-cols-12 gap-2 px-4 py-3 items-center border-b border-gray-50 last:border-0 transition-colors ${isSelected ? "bg-brand-50" : "hover:bg-gray-50"}`}
              >
                {/* Select checkbox */}
                <div className="col-span-1">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={!canSelect}
                    onChange={() => onSelectForRank(c.id, c.name)}
                    className="accent-brand-600 cursor-pointer disabled:opacity-40"
                    title={!canSelect ? "Max 5 candidates for ranking" : "Select for ranking"}
                  />
                </div>

                {/* Name + metadata */}
                <div className="col-span-3 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Joined {new Date(c.joinedAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                  </p>
                </div>

                {/* Country */}
                <div className="col-span-2">
                  <p className="text-xs text-gray-600">{COUNTRY_LABELS[c.country] || c.country || "—"}</p>
                  {c.nysc_status && c.nysc_status !== "not_applicable" && (
                    <p className="text-[10px] text-gray-400">NYSC: {c.nysc_status}</p>
                  )}
                </div>

                {/* Has CV */}
                <div className="col-span-1 flex justify-center">
                  {c.hasCv ? (
                    <span className="text-xs text-teal-600 font-medium">✓</span>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </div>

                {/* Avg score */}
                <div className="col-span-2 flex justify-center">
                  <ScoreBadge score={c.avgMatchScore} />
                </div>

                {/* Interviews */}
                <div className="col-span-1 text-center">
                  <p className="text-xs font-semibold text-gray-700">{c.interviewCount}</p>
                  {c.totalApplications > 0 && (
                    <p className="text-[10px] text-gray-400">{c.interviewRate}%</p>
                  )}
                </div>

                {/* Actions */}
                <div className="col-span-2 flex justify-end gap-2">
                  <button
                    onClick={() => onViewCandidate(c.id)}
                    className="text-xs text-brand-600 hover:text-brand-800 font-medium cursor-pointer transition-colors"
                  >
                    View
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  VIEW: Candidate detail
// ─────────────────────────────────────────────────────────────
const CandidateDetailView = ({ userId, onBack, onAddToRank }) => {
  const [data, setData] = useState(null);
  const [skillProfile, setSkillProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(`/recruiter/candidate/${userId}`)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, [userId]);

  const loadSkills = async () => {
    setIsLoadingSkills(true);
    try {
      const sp = await api.post("/recruiter/skill-profile", { userId });
      setSkillProfile(sp);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingSkills(false);
    }
  };

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  if (error) return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer">← Back</button>
      <div className="bg-coral-50 border border-coral-200 rounded-xl p-4"><p className="text-sm text-coral-700">{error}</p></div>
    </div>
  );

  const { profile, cv, stats, versions, recentJobs } = data;
  const statusColors = {
    saved: "bg-gray-100 text-gray-600",
    applied: "bg-brand-50 text-brand-700",
    interview: "bg-teal-50 text-teal-700",
    offer: "bg-teal-100 text-teal-800",
    rejected: "bg-coral-50 text-coral-600",
  };

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer transition-colors">← Candidates</button>
          <span className="text-gray-200">·</span>
          <h2 className="text-base font-bold text-gray-900">{profile.name}</h2>
        </div>
        <button
          onClick={() => onAddToRank(userId, profile.name)}
          className="text-xs px-3 py-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-semibold cursor-pointer transition-colors"
        >
          + Add to ranking
        </button>
      </div>

      {/* Profile + stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center">
            <span className="text-lg font-bold text-brand-700">
              {profile.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "??"}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{profile.name}</p>
            <p className="text-xs text-gray-400">{COUNTRY_LABELS[profile.country] || profile.country || "Location not set"}</p>
            {profile.nysc_status && profile.nysc_status !== "not_applicable" && (
              <p className="text-xs text-gray-400 mt-0.5">NYSC: {profile.nysc_status}</p>
            )}
          </div>
          <p className="text-xs text-gray-300">
            Joined {new Date(profile.joinedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>
          {cv && (
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-bold mb-0.5">Active CV</p>
              <p className="text-xs text-gray-700">{cv.fileName || "CV uploaded"}</p>
              <p className="text-[10px] text-gray-400">{cv.wordCount?.toLocaleString()} words</p>
            </div>
          )}
        </div>

        {/* Performance stats */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatTile label="Applications" value={stats.totalApplications} />
          <StatTile label="CV versions" value={stats.totalVersions} />
          <StatTile label="Best match score" value={stats.bestMatchScore || "—"} />
          <StatTile label="Avg match score" value={stats.avgMatchScore || "—"} />
          <StatTile label="Interview rate" value={`${stats.interviewRate}%`} />
          <StatTile label="Offers" value={stats.statusCounts?.offer || 0} />
        </div>
      </div>

      {/* Skill profile */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Skill profile</p>
          {!skillProfile && (
            <button
              onClick={loadSkills}
              disabled={isLoadingSkills || !cv}
              className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:border-brand-300 hover:text-brand-700 cursor-pointer disabled:opacity-40 transition-colors font-medium"
            >
              {isLoadingSkills ? "Analysing…" : "Analyse skills"}
            </button>
          )}
        </div>

        {isLoadingSkills && <div className="flex items-center gap-3 py-4"><Spinner size="sm" /><p className="text-xs text-gray-400">Extracting skill profile…</p></div>}

        {skillProfile && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-brand-50 text-brand-700 border-brand-100 capitalize">
                {skillProfile.level}
              </span>
              <p className="text-xs text-gray-500 flex-1">{skillProfile.summary}</p>
            </div>
            {skillProfile.top_skills?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {skillProfile.top_skills.map((s) => (
                  <span key={s} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full font-medium">{s}</span>
                ))}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Technical", skills: skillProfile.technical },
                { label: "Soft", skills: skillProfile.soft },
                { label: "Domain", skills: skillProfile.domain },
              ].map(({ label, skills }) => (
                <div key={label}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">{label}</p>
                  <div className="space-y-2">
                    {(skills || []).slice(0, 5).map((s) => (
                      <div key={s.skill}>
                        <p className="text-[10px] text-gray-600 mb-0.5 truncate">{s.skill}</p>
                        <MiniBar score={s.score} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!skillProfile && !isLoadingSkills && !cv && (
          <p className="text-xs text-gray-300 italic">No CV uploaded — skill analysis unavailable.</p>
        )}
      </div>

      {/* Recent applications */}
      {recentJobs?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Recent applications</p>
          <div className="space-y-2">
            {recentJobs.map((j) => (
              <div key={j.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{j.job_title}</p>
                  <p className="text-xs text-gray-400 truncate">{j.company_name}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0 ${statusColors[j.status] || "bg-gray-100 text-gray-600"}`}>
                  {j.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CV excerpt */}
      {cv?.rawText && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">CV excerpt</p>
          <pre className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap font-sans line-clamp-12">
            {cv.rawText}
          </pre>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  VIEW: Rank Tool
// ─────────────────────────────────────────────────────────────
const RankToolView = ({ preselectedIds, preselectedNames }) => {
  const [jobDescription, setJobDescription] = useState("");
  const [useFromPlatform] = useState(preselectedIds?.length > 0);
  const [manualCandidates, setManualCandidates] = useState([
    { name: "", cvText: "" },
    { name: "", cvText: "" },
  ]);
  const [isRanking, setIsRanking] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const updateCandidate = (i, field, val) =>
    setManualCandidates((prev) => prev.map((c, idx) => idx === i ? { ...c, [field]: val } : c));

  const handleRank = async () => {
    if (!jobDescription.trim()) { setError("Paste a job description first."); return; }
    setError(null);
    setIsRanking(true);
    try {
      const payload = { jobDescription };
      if (useFromPlatform && preselectedIds?.length) {
        payload.userIds = preselectedIds;
      } else {
        payload.candidates = manualCandidates.filter((c) => c.name.trim() && c.cvText.trim().length >= 50);
        if (payload.candidates.length < 2) { setError("Add at least 2 candidates with CV text."); setIsRanking(false); return; }
      }
      const data = await api.post("/recruiter/rank", payload);
      setResults(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsRanking(false);
    }
  };

  const scoreColor = (s) => s >= 70 ? "text-teal-700" : s >= 50 ? "text-amber-700" : "text-coral-600";

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold text-gray-900">Rank candidates</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          {useFromPlatform
            ? `Ranking ${preselectedIds.length} platform candidate${preselectedIds.length !== 1 ? "s" : ""} — paste the job description below.`
            : "Paste a job description and up to 5 CVs to rank candidates."}
        </p>
      </div>

      {useFromPlatform && preselectedNames?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {preselectedNames.map((name, i) => (
            <span key={i} className="text-xs px-2.5 py-1 bg-brand-50 text-brand-700 rounded-full border border-brand-100 font-medium">
              {name}
            </span>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <label className="block text-xs font-medium text-gray-700 mb-2">Job description</label>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the full job description…"
          rows={7}
          className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600 resize-none placeholder:text-gray-300"
        />
      </div>

      {!useFromPlatform && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">CVs to rank</p>
            {manualCandidates.length < 5 && (
              <button
                onClick={() => setManualCandidates((p) => [...p, { name: "", cvText: "" }])}
                className="text-xs text-brand-600 hover:text-brand-800 font-medium cursor-pointer"
              >
                + Add candidate
              </button>
            )}
          </div>
          {manualCandidates.map((c, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-100 flex items-center justify-center text-[10px] font-bold text-brand-700 shrink-0">{i + 1}</span>
                <input
                  type="text"
                  value={c.name}
                  onChange={(e) => updateCandidate(i, "name", e.target.value)}
                  placeholder="Candidate name"
                  className="flex-1 text-sm font-medium bg-transparent border-none outline-none placeholder:text-gray-300"
                />
                {manualCandidates.length > 2 && (
                  <button onClick={() => setManualCandidates((p) => p.filter((_, idx) => idx !== i))} className="text-xs text-gray-300 hover:text-coral-500 cursor-pointer">Remove</button>
                )}
              </div>
              <textarea
                value={c.cvText}
                onChange={(e) => updateCandidate(i, "cvText", e.target.value)}
                placeholder="Paste CV text…"
                rows={4}
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600 resize-none placeholder:text-gray-300"
              />
            </div>
          ))}
        </div>
      )}

      {!results && (
        <button
          onClick={handleRank}
          disabled={isRanking || !jobDescription.trim()}
          className="w-full py-3 bg-brand-600 text-white rounded-xl font-semibold text-sm hover:bg-brand-700 disabled:opacity-50 cursor-pointer transition-colors"
        >
          {isRanking ? "Ranking…" : "Rank candidates"}
        </button>
      )}

      {isRanking && (
        <div className="flex flex-col items-center py-8 gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-gray-500">Scoring and ranking…</p>
        </div>
      )}

      {results && !isRanking && (
        <div className="space-y-4">
          {results.pool_summary && (
            <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4">
              <p className="text-xs font-semibold text-brand-800 uppercase tracking-wide mb-1">Pool summary</p>
              <p className="text-sm text-brand-900 leading-relaxed">{results.pool_summary}</p>
            </div>
          )}

          {results.rankings?.map((r) => (
            <div key={r.rank} className={`bg-white rounded-2xl border p-4 shadow-sm ${r.name === results.top_pick ? "border-teal-300 ring-1 ring-teal-200" : "border-gray-100"}`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-gray-500">#{r.rank}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900">{r.name}</p>
                    {r.name === results.top_pick && (
                      <span className="text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full">Top pick</span>
                    )}
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.hireable ? "bg-teal-50 text-teal-700" : "bg-coral-50 text-coral-600"}`}>
                      {r.hireable ? "Hireable" : "Not recommended"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{r.verdict}</p>
                </div>
                <span className={`text-2xl font-bold shrink-0 ${scoreColor(r.overallScore)}`}>{r.overallScore}</span>
              </div>
              {(r.strengths?.length > 0 || r.concerns?.length > 0) && (
                <div className="mt-3 pt-3 border-t border-gray-50 grid grid-cols-2 gap-3">
                  <div>
                    {r.strengths?.map((s, i) => (
                      <p key={i} className="text-xs text-gray-600 flex items-start gap-1.5 mb-1">
                        <span className="text-teal-500 shrink-0">✓</span>{s}
                      </p>
                    ))}
                  </div>
                  <div>
                    {r.concerns?.map((c, i) => (
                      <p key={i} className="text-xs text-gray-600 flex items-start gap-1.5 mb-1">
                        <span className="text-coral-400 shrink-0">✗</span>{c}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          <button
            onClick={() => setResults(null)}
            className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
          >
            ← New ranking
          </button>
        </div>
      )}

      {error && (
        <div className="bg-coral-50 border border-coral-200 rounded-xl p-3">
          <p className="text-sm text-coral-700">{error}</p>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  Root: RecruiterPortal
// ─────────────────────────────────────────────────────────────
const RecruiterPortal = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const [isRecruiter, setIsRecruiter] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // overview | candidates | rank
  const [activeCandidateId, setActiveCandidateId] = useState(null);
  const [selectedForRank, setSelectedForRank] = useState(new Set());
  const [selectedNames, setSelectedNames] = useState({});

  // Role check on mount
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        setIsRecruiter(data?.role === "recruiter");
        setIsCheckingRole(false);
      });
  }, [user]);

  const toggleSelectForRank = (id, name) => {
    setSelectedForRank((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setSelectedNames((n) => { const nn = { ...n }; delete nn[id]; return nn; });
      } else if (next.size < 5) {
        next.add(id);
        if (name) setSelectedNames((n) => ({ ...n, [id]: name }));
      }
      return next;
    });
  };

  const handleViewCandidate = (id) => {
    setActiveCandidateId(id);
  };

  const handleAddToRank = (id, name) => {
    if (!selectedForRank.has(id) && selectedForRank.size < 5) {
      setSelectedForRank((prev) => new Set([...prev, id]));
      setSelectedNames((n) => ({ ...n, [id]: name }));
    }
    setActiveCandidateId(null);
    setActiveTab("rank");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "candidates", label: "Candidates" },
    { id: "rank", label: `Rank${selectedForRank.size > 0 ? ` (${selectedForRank.size})` : ""}` },
  ];

  // ── Loading ──
  if (isCheckingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    );
  }

  // ── Access denied ──
  if (!isRecruiter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3 max-w-sm px-6">
          <div className="w-14 h-14 bg-coral-50 rounded-2xl flex items-center justify-center mx-auto">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <p className="text-base font-bold text-gray-900">Recruiter access only</p>
          <p className="text-sm text-gray-400">This dashboard is restricted to Seevv recruiter accounts. Contact your admin to request access.</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-sm text-brand-600 hover:text-brand-800 font-medium cursor-pointer"
          >
            ← Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Recruiter portal ──
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">
        {/* Brand */}
        <div className="h-16 px-5 border-b border-gray-100 flex items-center gap-2 shrink-0">
          <img src="/logo.png" alt="Seevv" className="h-8 object-contain" />
          <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded">RECRUITER</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setActiveCandidateId(null); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                activeTab === tab.id && !activeCandidateId
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {tab.id === "overview" && (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
                </svg>
              )}
              {tab.id === "candidates" && (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              )}
              {tab.id === "rank" && (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              )}
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-gray-100 space-y-1">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
            </svg>
            Candidate portal
          </button>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-coral-600 hover:bg-coral-50 cursor-pointer transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {activeCandidateId ? (
            <CandidateDetailView
              userId={activeCandidateId}
              onBack={() => setActiveCandidateId(null)}
              onAddToRank={handleAddToRank}
            />
          ) : (
            <>
              {activeTab === "overview" && <OverviewView />}
              {activeTab === "candidates" && (
                <CandidatesView
                  onViewCandidate={handleViewCandidate}
                  onSelectForRank={toggleSelectForRank}
                  selectedForRank={selectedForRank}
                />
              )}
              {activeTab === "rank" && (
                <RankToolView
                  preselectedIds={[...selectedForRank]}
                  preselectedNames={Object.values(selectedNames)}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default RecruiterPortal;
