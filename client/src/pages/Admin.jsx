import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import useAuthStore from "@/store/authStore";
import { supabase } from "@/lib/supabase";
import { FEATURES, PLAN_HIERARCHY, PLAN_LABELS, ROLE_LABELS } from "@/lib/features";

// ─── Colour helpers ────────────────────────────────────────
const planColor = {
  free:     "bg-gray-100 text-gray-600 border-gray-200",
  starter:  "bg-brand-50 text-brand-700 border-brand-200",
  pro:      "bg-teal-50 text-teal-700 border-teal-200",
  pro_plus: "bg-amber-50 text-amber-700 border-amber-200",
};
const roleColor = {
  user:      "bg-gray-100 text-gray-600",
  recruiter: "bg-purple-50 text-purple-700",
  admin:     "bg-red-50 text-red-700",
};

const PlanBadge = ({ plan }) => (
  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${planColor[plan] || planColor.free}`}>
    {PLAN_LABELS[plan] || plan || "Free"}
  </span>
);
const RoleBadge = ({ role }) => (
  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${roleColor[role] || roleColor.user}`}>
    {ROLE_LABELS[role] || role}
  </span>
);

// ─── Stat card ─────────────────────────────────────────────
const StatCard = ({ label, value, sub, accent }) => (
  <div className={`rounded-2xl border p-5 shadow-sm ${accent || "bg-white border-gray-100"}`}>
    <p className="text-xs text-gray-400 mb-1">{label}</p>
    <p className="text-3xl font-bold text-gray-900">{value ?? "—"}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

// ─── Download helper ──────────────────────────────────────
const downloadFile = async (url, fileName, token) => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({}),
  });
  if (!response.ok) { const e = await response.json(); throw new Error(e.error || "Download failed"); }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl; a.download = fileName;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(objectUrl);
};

// ─── Edit user modal ───────────────────────────────────────
const EditUserModal = ({ user, onClose, onSave }) => {
  const [role, setRole]   = useState(user.role || "user");
  const [plan, setPlan]   = useState(user.plan || "free");
  const [overrides, setOverrides] = useState(user.feature_overrides || {});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  const handleToggleOverride = (key, value) => {
    setOverrides((prev) => {
      const next = { ...prev };
      if (next[key] === value) { delete next[key]; } else { next[key] = value; }
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(user.id, { role, plan, feature_overrides: overrides });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-4">
          <div>
            <p className="font-bold text-gray-900">{user.full_name || "Unnamed user"}</p>
            <p className="text-xs text-gray-400">{user.email}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="flex border-b border-gray-100 px-6">
          {["details", "features"].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`text-xs font-semibold py-3 px-1 mr-5 border-b-2 transition-colors cursor-pointer capitalize ${
                activeTab === tab ? "border-brand-600 text-brand-700" : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab === "details" ? "Role & Plan" : "Feature Overrides"}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {activeTab === "details" && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">Role</p>
                <div className="grid grid-cols-3 gap-2">
                  {["user", "recruiter", "admin"].map((r) => (
                    <button key={r} onClick={() => setRole(r)}
                      className={`text-xs font-semibold py-2 px-3 rounded-xl border-2 transition-all cursor-pointer ${
                        role === r ? "border-brand-600 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >{ROLE_LABELS[r]}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">Plan</p>
                <div className="grid grid-cols-2 gap-2">
                  {PLAN_HIERARCHY.map((p) => (
                    <button key={p} onClick={() => setPlan(p)}
                      className={`text-xs font-semibold py-2 px-3 rounded-xl border-2 transition-all cursor-pointer ${
                        plan === p ? "border-brand-600 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >{PLAN_LABELS[p]}</button>
                  ))}
                </div>
              </div>
              <div className="pt-2 border-t border-gray-50">
                <p className="text-xs text-gray-400">Joined: {user.created_at ? new Date(user.created_at).toLocaleDateString() : "Unknown"}</p>
                {user.plan_expires_at && <p className="text-xs text-gray-400 mt-1">Plan expires: {new Date(user.plan_expires_at).toLocaleDateString()}</p>}
              </div>
            </div>
          )}
          {activeTab === "features" && (
            <div className="space-y-2">
              <p className="text-xs text-gray-400 mb-4">
                Override individual features for this user.
                <span className="font-semibold text-teal-600"> Green = forced ON</span>,{" "}
                <span className="font-semibold text-red-500">Red = forced OFF</span>, Grey = plan default.
              </p>
              {Object.entries(FEATURES).map(([key, feat]) => {
                const override = overrides[key];
                return (
                  <div key={key} className="flex items-center justify-between gap-3 py-2 border-b border-gray-50">
                    <div>
                      <p className="text-xs font-medium text-gray-800">{feat.label}</p>
                      <p className="text-[10px] text-gray-400">Default: {PLAN_LABELS[feat.minPlan]}+</p>
                    </div>
                    <div className="flex gap-1">
                      {[["ON", true, "teal"], ["DEFAULT", null, "gray"], ["OFF", false, "red"]].map(([label, val, col]) => (
                        <button key={label} onClick={() => handleToggleOverride(key, val)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                            override === val
                              ? col === "teal" ? "bg-teal-500 text-white border-teal-500"
                              : col === "red" ? "bg-red-500 text-white border-red-500"
                              : "bg-gray-200 text-gray-600 border-gray-300"
                              : `border-gray-200 text-gray-400 hover:border-${col}-300`
                          }`}
                        >{label}</button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-800 transition-colors cursor-pointer disabled:opacity-50"
          >{saving ? "Saving…" : "Save changes"}</button>
          <button onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-gray-600 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
          >Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ─── Delete confirm ────────────────────────────────────────
const DeleteConfirm = ({ user, onClose, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center" onClick={(e) => e.stopPropagation()}>
      <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6" /><path d="M14 11v6" />
        </svg>
      </div>
      <p className="font-bold text-gray-900 mb-1">Delete user?</p>
      <p className="text-sm text-gray-400 mb-6">
        <span className="font-medium text-gray-700">{user.full_name || user.email}</span> will be permanently deleted.
      </p>
      <div className="flex gap-3">
        <button onClick={onConfirm} className="flex-1 py-2.5 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-red-600 cursor-pointer">Delete permanently</button>
        <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm font-semibold text-gray-600 rounded-xl hover:bg-gray-50 cursor-pointer">Cancel</button>
      </div>
    </div>
  </div>
);

// ─── Sidebar nav item ──────────────────────────────────────
const NavItem = ({ icon, label, active, badge, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer text-left ${
      active ? "bg-brand-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }`}
  >
    <span className={`shrink-0 ${active ? "text-white" : "text-gray-400"}`}>{icon}</span>
    <span className="flex-1">{label}</span>
    {badge !== undefined && (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>{badge}</span>
    )}
  </button>
);

// ─── Icons ─────────────────────────────────────────────────
const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((path, i) => <path key={i} d={path} />) : <path d={d} />}
  </svg>
);

// ─── Users table ───────────────────────────────────────────
const UsersTable = ({ users, onEdit, onDelete, loading, error, filterRole }) => {
  const filtered = filterRole ? users.filter((u) => (u.role || "user") === filterRole) : users;
  if (loading) return <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (error) return <div className="px-5 py-4 text-sm text-red-600">{error}</div>;
  if (filtered.length === 0) return <div className="text-center py-16"><p className="text-sm text-gray-400">No users found.</p></div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="text-left px-5 py-3 font-semibold text-gray-500">User</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-500">Role</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-500">Plan</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-500">Overrides</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-500">Joined</th>
            <th className="text-right px-5 py-3 font-semibold text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((u) => {
            const overrideCount = Object.keys(u.feature_overrides || {}).length;
            return (
              <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5">
                  <p className="font-semibold text-gray-900">{u.full_name || "—"}</p>
                  <p className="text-gray-400">{u.email}</p>
                </td>
                <td className="px-4 py-3.5"><RoleBadge role={u.role || "user"} /></td>
                <td className="px-4 py-3.5"><PlanBadge plan={u.plan || "free"} /></td>
                <td className="px-4 py-3.5 text-gray-400">
                  {overrideCount > 0 ? <span className="text-amber-600 font-semibold">{overrideCount} override{overrideCount !== 1 ? "s" : ""}</span> : "—"}
                </td>
                <td className="px-4 py-3.5 text-gray-400">{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button onClick={() => onEdit(u)} className="text-brand-600 hover:text-brand-800 font-semibold cursor-pointer">Edit</button>
                    <button onClick={() => onDelete(u)} className="text-red-400 hover:text-red-600 font-semibold cursor-pointer">Delete</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ─── Content library ───────────────────────────────────────
const ContentLibrary = ({ type }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [error, setError] = useState(null);

  const endpoint = type === "cvs" ? "/admin/content/cvs" : "/admin/content/cover-letters";

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await api.get(endpoint);
        setItems(type === "cvs" ? (data.cvs || []) : (data.letters || []));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [type, endpoint]);

  const handleDownload = async (item) => {
    setDownloading(item.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");
      const base = import.meta.env.VITE_API_URL;
      if (type === "cvs") {
        await downloadFile(`${base}/export/admin/cv/${item.id}`, `${item.profile?.full_name || "CV"} - CV.pdf`, session.access_token);
      } else {
        await downloadFile(`${base}/export/admin/cover-letter/${item.id}`, `${item.profile?.full_name || "Cover Letter"} - Cover Letter.pdf`, session.access_token);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloading(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (error) return <div className="p-5 text-sm text-red-600">{error}</div>;
  if (items.length === 0) return <div className="text-center py-16"><p className="text-sm text-gray-400">No {type === "cvs" ? "CVs" : "cover letters"} found.</p></div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="text-left px-5 py-3 font-semibold text-gray-500">User</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-500">{type === "cvs" ? "Version" : "Job"}</th>
            {type === "cvs" && <th className="text-left px-4 py-3 font-semibold text-gray-500">Match</th>}
            <th className="text-left px-4 py-3 font-semibold text-gray-500">Tone</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-500">Created</th>
            <th className="text-right px-5 py-3 font-semibold text-gray-500">Download</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td className="px-5 py-3.5">
                <p className="font-semibold text-gray-900">{item.profile?.full_name || "—"}</p>
                <p className="text-gray-400">{item.profile?.email || ""}</p>
              </td>
              <td className="px-4 py-3.5">
                <p className="font-medium text-gray-800">{item.job_target?.job_title || item.version_name || "—"}</p>
                <p className="text-gray-400">{item.job_target?.company_name || ""}</p>
              </td>
              {type === "cvs" && (
                <td className="px-4 py-3.5">
                  {item.match_score > 0
                    ? <span className="text-teal-700 font-semibold">{item.match_score}%</span>
                    : <span className="text-gray-300">—</span>}
                </td>
              )}
              <td className="px-4 py-3.5 text-gray-500 capitalize">{item.tone || "—"}</td>
              <td className="px-4 py-3.5 text-gray-400">{item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}</td>
              <td className="px-5 py-3.5 text-right">
                <button
                  onClick={() => handleDownload(item)}
                  disabled={downloading === item.id}
                  className="text-brand-600 hover:text-brand-800 font-semibold cursor-pointer disabled:opacity-40 flex items-center gap-1 ml-auto"
                >
                  {downloading === item.id ? (
                    <span className="animate-pulse">Downloading…</span>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      PDF
                    </>
                  )}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ─── Platform stats ────────────────────────────────────────
const PlatformStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get("/admin/stats/extended");
        setStats(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total users" value={stats.totalUsers} sub={`+${stats.newThisWeek} this week`} />
        <StatCard label="CV versions" value={stats.totalCVVersions} />
        <StatCard label="Cover letters" value={stats.totalCoverLetters} />
        <StatCard label="Avg match score" value={stats.avgMatchScore ? `${stats.avgMatchScore}%` : "—"} sub="Across all CVs" />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Plan distribution</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {PLAN_HIERARCHY.map((p) => {
            const count = stats.byPlan[p] || 0;
            const pct = stats.totalUsers ? Math.round((count / stats.totalUsers) * 100) : 0;
            return (
              <div key={p}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-gray-700">{PLAN_LABELS[p]}</span>
                  <span className="text-xs text-gray-400">{count}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">{pct}%</p>
              </div>
            );
          })}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Role breakdown</p>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(stats.byRole).map(([role, count]) => (
            <div key={role} className="text-center p-4 rounded-xl bg-gray-50">
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-xs text-gray-400 mt-1 capitalize">{ROLE_LABELS[role] || role}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Total job targets" value={stats.totalJobTargets} />
        <StatCard label="Paid subscribers" value={(stats.byPlan.starter || 0) + (stats.byPlan.pro || 0) + (stats.byPlan.pro_plus || 0)} sub="Starter + Pro + Pro+" />
      </div>
    </div>
  );
};

// ─── Verification requests ────────────────────────────────
const BADGE_LABELS = {
  identity:   "Identity Verified",
  employment: "Employment Verified",
  education:  "Education Verified",
  skills:     "Skills Assessed",
};

const VerificationRequests = ({ requests, onApprove, onReject, loading }) => {
  const [actioning, setActioning] = useState(null);

  const act = async (fn, id) => {
    setActioning(id);
    await fn(id);
    setActioning(null);
  };

  if (loading) return <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (requests.length === 0) return (
    <div className="text-center py-16">
      <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>
        </svg>
      </div>
      <p className="text-sm text-gray-400">No pending verification requests.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {requests.map((req) => (
        <div key={req.id} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900">{req.profile?.full_name || "Unknown user"}</p>
            <p className="text-xs text-gray-400 truncate">{req.profile?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full border border-amber-100">{BADGE_LABELS[req.badge_type] || req.badge_type}</span>
              <span className="text-[10px] text-gray-400">{new Date(req.requested_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => act(onApprove, req.id)} disabled={actioning === req.id}
              className="text-xs font-semibold px-3 py-1.5 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors cursor-pointer disabled:opacity-50">
              {actioning === req.id ? "…" : "Approve"}
            </button>
            <button onClick={() => act(onReject, req.id)} disabled={actioning === req.id}
              className="text-xs font-semibold px-3 py-1.5 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50">
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Notification toast ────────────────────────────────────
const NotifToast = ({ notif, onDismiss, onView }) => {
  useEffect(() => {
    const t = setTimeout(onDismiss, 8000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className="bg-white rounded-xl shadow-2xl border border-gray-100 p-4 flex items-start gap-3 w-80 animate-in slide-in-from-bottom-4 duration-300">
      <div className="w-9 h-9 bg-red-50 rounded-full flex items-center justify-center shrink-0">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900">
          {notif.newCount === 1 ? "New verification request" : `${notif.newCount} new verification requests`}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 truncate">
          {notif.newCount === 1
            ? `${notif.requests[0]?.profile?.full_name || "A user"} — ${BADGE_LABELS[notif.requests[0]?.badge_type] || ""}`
            : `${notif.requests.map((r) => r.profile?.full_name || "a user").slice(0, 2).join(", ")}${notif.newCount > 2 ? ` +${notif.newCount - 2} more` : ""}`}
        </p>
        <div className="flex gap-3 mt-2">
          <button onClick={onView} className="text-xs font-semibold text-brand-700 hover:text-brand-900 cursor-pointer">Review →</button>
          <button onClick={onDismiss} className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer">Dismiss</button>
        </div>
      </div>
    </div>
  );
};

// ─── Main admin page ───────────────────────────────────────
const Admin = () => {
  const navigate    = useNavigate();
  const profile     = useAuthStore((s) => s.profile);
  const isLoading   = useAuthStore((s) => s.isLoading);

  const [section, setSection]   = useState("overview");
  const [stats,   setStats]     = useState(null);
  const [users,   setUsers]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search,  setSearch]    = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [editUser,   setEditUser]   = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [error,      setError]      = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [verifLoading, setVerifLoading]                 = useState(false);
  const [notifs, setNotifs]                             = useState([]);
  const prevVerifCountRef = useRef(null);

  useEffect(() => {
    if (!isLoading && profile && profile.role !== "admin") navigate("/dashboard", { replace: true });
  }, [isLoading, profile, navigate]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search)     params.set("search", search);
      if (roleFilter) params.set("role",   roleFilter);
      if (planFilter) params.set("plan",   planFilter);
      const [statsData, usersData] = await Promise.all([
        api.get("/admin/stats"),
        api.get(`/admin/users?${params}`),
      ]);
      setStats(statsData);
      setUsers(usersData.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, planFilter]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const fetchVerifications = useCallback(async () => {
    setVerifLoading(true);
    try {
      const data = await api.get("/admin/verification-requests");
      const requests = data.requests || [];
      if (prevVerifCountRef.current !== null && requests.length > prevVerifCountRef.current) {
        const diff = requests.length - prevVerifCountRef.current;
        setNotifs((prev) => [...prev, { id: Date.now(), newCount: diff, requests: requests.slice(0, diff) }]);
      }
      prevVerifCountRef.current = requests.length;
      setPendingVerifications(requests);
    } catch { } finally {
      setVerifLoading(false);
    }
  }, []);

  const handleApproveVerif = useCallback(async (requestId) => {
    const req = pendingVerifications.find((r) => r.id === requestId);
    if (!req) return;
    try {
      await api.patch("/admin/verification-requests/approve", { userId: req.user_id, badgeType: req.badge_type });
      setPendingVerifications((prev) => prev.filter((r) => r.id !== requestId));
      if (prevVerifCountRef.current !== null) prevVerifCountRef.current -= 1;
    } catch (err) { setError(err.message); }
  }, [pendingVerifications]);

  const handleRejectVerif = useCallback(async (requestId) => {
    const req = pendingVerifications.find((r) => r.id === requestId);
    if (!req) return;
    try {
      await api.patch("/admin/verification-requests/reject", { userId: req.user_id, badgeType: req.badge_type });
      setPendingVerifications((prev) => prev.filter((r) => r.id !== requestId));
      if (prevVerifCountRef.current !== null) prevVerifCountRef.current -= 1;
    } catch (err) { setError(err.message); }
  }, [pendingVerifications]);

  const dismissNotif = useCallback((id) => setNotifs((prev) => prev.filter((n) => n.id !== id)), []);

  useEffect(() => {
    if (!profile || profile.role !== "admin") return;
    fetchVerifications();
    const interval = setInterval(fetchVerifications, 30000);
    return () => clearInterval(interval);
  }, [fetchVerifications, profile]);

  const handleSaveUser = async (id, updates) => {
    try {
      const updated = await api.patch(`/admin/users/${id}`, updates);
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
    } catch (err) { setError(err.message); }
  };

  const handleDeleteUser = async (id) => {
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setDeleteUser(null);
    } catch (err) { setError(err.message); }
  };

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <img src="/favicon.png" alt="Loading" className="w-12 h-12 object-contain"
          style={{ animation: "seevv-breathe 1.6s ease-in-out infinite" }} />
        <style>{`@keyframes seevv-breathe { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(.88)} }`}</style>
      </div>
    );
  }

  const navSections = [
    {
      group: "Admin Panel",
      items: [
        { id: "overview",       label: "Overview",        icon: <Icon d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />, badge: stats?.total },
        { id: "users",          label: "All Users",       icon: <Icon d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />, badge: users.filter(u => (u.role || "user") === "user").length },
        { id: "recruiters",     label: "Recruiters",      icon: <Icon d={["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2", "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"]} />, badge: users.filter(u => u.role === "recruiter").length },
        { id: "verifications",  label: "Verifications",   icon: <Icon d={["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", "M9 12l2 2 4-4"]} />, badge: pendingVerifications.length || undefined },
      ],
    },
    {
      group: "Content Library",
      items: [
        { id: "cvs",          label: "Candidate CVs",       icon: <Icon d={["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6", "M16 13H8", "M16 17H8", "M10 9H8"]} /> },
        { id: "cover_letters", label: "Cover Letters",      icon: <Icon d={["M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z", "M22 6l-10 7L2 6"]} /> },
      ],
    },
    {
      group: "Analytics",
      items: [
        { id: "platform_stats", label: "Platform Stats", icon: <Icon d={["M18 20V10", "M12 20V4", "M6 20v-6"]} /> },
      ],
    },
  ];

  const sectionTitle = {
    overview:       "Overview",
    users:          "All Users",
    recruiters:     "Recruiters",
    verifications:  "Verification Requests",
    cvs:            "Candidate CVs",
    cover_letters:  "Cover Letters",
    platform_stats: "Platform Stats",
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ── Sidebar ───────────────────────────────────── */}
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`
        fixed top-0 left-0 h-full z-50 w-64 bg-white border-r border-gray-100 flex flex-col shadow-xl transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:shadow-none lg:z-auto
      `}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/favicon.png" alt="Seevv" className="w-7 h-7 object-contain" />
            <span className="font-bold text-gray-900 text-sm">Admin Panel</span>
          </div>
          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-red-50 text-red-600 rounded border border-red-100 uppercase tracking-widest">ADMIN</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navSections.map((group) => (
            <div key={group.group}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-3 mb-2">{group.group}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavItem
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    active={section === item.id}
                    badge={item.badge}
                    onClick={() => { setSection(item.id); setSidebarOpen(false); }}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back to app
          </button>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-400 hover:text-gray-700 cursor-pointer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div>
              <h1 className="text-sm font-bold text-gray-900">{sectionTitle[section]}</h1>
              <p className="text-xs text-gray-400 hidden sm:block">
                {section === "overview" && "Platform summary and user management"}
                {section === "users" && "All registered job seekers"}
                {section === "recruiters" && "Registered recruiter accounts"}
                {section === "verifications" && `${pendingVerifications.length} pending request${pendingVerifications.length !== 1 ? "s" : ""}`}
                {section === "cvs" && "All CV versions across the platform"}
                {section === "cover_letters" && "All cover letters across the platform"}
                {section === "platform_stats" && "In-depth platform metrics and analytics"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-xs text-gray-400 hidden sm:block">{profile?.full_name || profile?.email}</p>
            {pendingVerifications.length > 0 && (
              <button onClick={() => setSection("verifications")} className="relative p-1.5 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {pendingVerifications.length}
                </span>
              </button>
            )}
            <span className="text-[10px] font-bold px-2 py-1 bg-red-50 text-red-600 rounded-full border border-red-100 uppercase tracking-widest">Admin</span>
          </div>
        </header>

        <main className="flex-1 px-5 py-6 max-w-7xl mx-auto w-full space-y-6">

          {/* ── Overview ─────────────────────────────── */}
          {section === "overview" && (
            <div className="space-y-6">
              {stats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="Total users" value={stats.total} sub={`+${stats.newThisWeek} this week`} />
                  <StatCard label="Job seekers" value={stats.byRole.user} />
                  <StatCard label="Recruiters"  value={stats.byRole.recruiter} />
                  <StatCard label="Paid users"  value={(stats.byPlan.starter || 0) + (stats.byPlan.pro || 0) + (stats.byPlan.pro_plus || 0)} sub="Starter + Pro + Pro+" />
                </div>
              )}
              {stats && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Plan distribution</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {PLAN_HIERARCHY.map((p) => {
                      const count = stats.byPlan[p] || 0;
                      const pct = stats.total ? Math.round((count / stats.total) * 100) : 0;
                      return (
                        <div key={p}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold text-gray-700">{PLAN_LABELS[p]}</span>
                            <span className="text-xs text-gray-400">{count}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1">{pct}%</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quick actions */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: "Manage Users", sub: "Edit roles, plans, overrides", id: "users", color: "from-brand-50 to-brand-100 border-brand-200" },
                  { label: "View CVs", sub: "Download candidate CVs", id: "cvs", color: "from-teal-50 to-teal-100 border-teal-200" },
                  { label: "Platform Stats", sub: "Full analytics dashboard", id: "platform_stats", color: "from-amber-50 to-amber-100 border-amber-200" },
                ].map((qa) => (
                  <button key={qa.id} onClick={() => setSection(qa.id)}
                    className={`bg-gradient-to-br ${qa.color} border rounded-2xl p-4 text-left hover:shadow-md transition-all cursor-pointer`}
                  >
                    <p className="font-semibold text-gray-900 text-sm">{qa.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{qa.sub}</p>
                  </button>
                ))}
              </div>

              {/* Recent users */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Recent users</p>
                  <button onClick={() => setSection("users")} className="text-xs text-brand-600 hover:text-brand-800 font-semibold cursor-pointer">View all →</button>
                </div>
                <UsersTable
                  users={users.slice(0, 5)}
                  onEdit={setEditUser}
                  onDelete={setDeleteUser}
                  loading={loading}
                  error={error}
                />
              </div>
            </div>
          )}

          {/* ── Verifications ───────────────────────── */}
          {section === "verifications" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <p className="text-xs text-gray-400">Approve or reject badge verification requests from users.</p>
              </div>
              <div className="p-5">
                <VerificationRequests
                  requests={pendingVerifications}
                  onApprove={handleApproveVerif}
                  onReject={handleRejectVerif}
                  loading={verifLoading}
                />
              </div>
            </div>
          )}

          {/* ── Users / Recruiters ──────────────────── */}
          {(section === "users" || section === "recruiters") && (
            <>
            {section === "recruiters" && (() => {
              const recs = users.filter((u) => u.role === "recruiter");
              const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
              return (
                <div className="grid grid-cols-3 gap-4">
                  <StatCard label="Total recruiters" value={recs.length} />
                  <StatCard label="Joined this week" value={recs.filter((r) => new Date(r.created_at) > weekAgo).length} sub="New this week" />
                  <StatCard label="Paid recruiters" value={recs.filter((r) => r.plan && r.plan !== "free").length} sub="Starter + Pro + Pro+" />
                </div>
              );
            })()}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="relative flex-1 max-w-xs">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name or email…"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600"
                  />
                </div>
                <div className="flex gap-2">
                  {section === "users" && (
                    <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
                      className="text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white"
                    >
                      <option value="">All roles</option>
                      {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  )}
                  <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}
                    className="text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white"
                  >
                    <option value="">All plans</option>
                    {PLAN_HIERARCHY.map((p) => <option key={p} value={p}>{PLAN_LABELS[p]}</option>)}
                  </select>
                </div>
              </div>
              <UsersTable
                users={users}
                onEdit={setEditUser}
                onDelete={setDeleteUser}
                loading={loading}
                error={error}
                filterRole={section === "recruiters" ? "recruiter" : ""}
              />
            </div>
            </>
          )}

          {/* ── CV Library ──────────────────────────── */}
          {section === "cvs" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <p className="text-xs text-gray-400">Download any candidate's tailored CV as a PDF.</p>
              </div>
              <ContentLibrary type="cvs" />
            </div>
          )}

          {/* ── Cover Letter Library ─────────────────── */}
          {section === "cover_letters" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <p className="text-xs text-gray-400">Download any candidate's cover letter as a PDF.</p>
              </div>
              <ContentLibrary type="cover_letters" />
            </div>
          )}

          {/* ── Platform Stats ──────────────────────── */}
          {section === "platform_stats" && <PlatformStats />}

        </main>
      </div>

      {/* Modals */}
      {editUser && <EditUserModal user={editUser} onClose={() => setEditUser(null)} onSave={handleSaveUser} />}
      {deleteUser && <DeleteConfirm user={deleteUser} onClose={() => setDeleteUser(null)} onConfirm={() => handleDeleteUser(deleteUser.id)} />}

      {/* Notification toasts */}
      {notifs.length > 0 && (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
          {notifs.slice(-3).map((n) => (
            <NotifToast
              key={n.id}
              notif={n}
              onDismiss={() => dismissNotif(n.id)}
              onView={() => { setSection("verifications"); dismissNotif(n.id); }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Admin;
