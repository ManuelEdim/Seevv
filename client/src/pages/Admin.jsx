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
  const [actioning, setActioning]         = useState(null);
  const [rejectingId, setRejectingId]     = useState(null);
  const [rejectReason, setRejectReason]   = useState("");

  const handleApprove = async (id) => {
    setActioning(id);
    await onApprove(id);
    setActioning(null);
  };

  const handleRejectClick = (id) => {
    setRejectingId(id);
    setRejectReason("");
  };

  const handleRejectConfirm = async (id) => {
    setActioning(id);
    await onReject(id, rejectReason.trim());
    setActioning(null);
    setRejectingId(null);
    setRejectReason("");
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
        <div key={req.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-4 p-4">
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
              <button onClick={() => handleApprove(req.id)} disabled={actioning === req.id || rejectingId === req.id}
                className="text-xs font-semibold px-3 py-1.5 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors cursor-pointer disabled:opacity-50">
                {actioning === req.id ? "…" : "Approve"}
              </button>
              {rejectingId === req.id ? (
                <button onClick={() => { setRejectingId(null); setRejectReason(""); }}
                  className="text-xs font-semibold px-3 py-1.5 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  Cancel
                </button>
              ) : (
                <button onClick={() => handleRejectClick(req.id)} disabled={actioning === req.id}
                  className="text-xs font-semibold px-3 py-1.5 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50">
                  Reject
                </button>
              )}
            </div>
          </div>

          {/* Rejection reason form — slides in below */}
          {rejectingId === req.id && (
            <div className="border-t border-red-50 bg-red-50/40 px-4 py-3 flex items-end gap-2">
              <div className="flex-1">
                <p className="text-[11px] font-semibold text-red-700 mb-1">Reason (optional — sent to user)</p>
                <input
                  autoFocus
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Documentation unclear or expired"
                  className="w-full text-xs border border-red-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-red-300/40"
                  onKeyDown={(e) => e.key === "Enter" && handleRejectConfirm(req.id)}
                />
              </div>
              <button
                onClick={() => handleRejectConfirm(req.id)}
                disabled={actioning === req.id}
                className="text-xs font-semibold px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              >
                {actioning === req.id ? "…" : "Confirm reject"}
              </button>
            </div>
          )}
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

// ─── AI Settings panel ────────────────────────────────────
const AISettingsPanel = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const loadSettings = async () => {
    try {
      const data = await api.get("/admin/ai-settings");
      setSettings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSettings(); }, []);

  const handleToggle = async () => {
    setSaving(true);
    try {
      const data = await api.put("/admin/ai-settings", { enabled: !settings.enabled });
      setSettings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleProviderChange = async (provider) => {
    setSaving(true);
    setError(null);
    try {
      const data = await api.put("/admin/ai-settings", { provider });
      setSettings(data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveProviderKey = async (provider, key) => {
    setError(null);
    const result = await api.put("/admin/ai-settings/key", { provider, key });
    setSettings((prev) => ({
      ...prev,
      providers: {
        ...prev.providers,
        [provider]: { ...prev.providers[provider], configured: true, keyPreview: result.keyPreview },
      },
    }));
  };

  const deleteProviderKey = async (provider) => {
    setError(null);
    try {
      const result = await api.delete(`/admin/ai-settings/key/${provider}`);
      if (result.envFallback) {
        const envVar = `${provider.toUpperCase()}_API_KEY`;
        setError(`DB key removed, but ${envVar} is still set as a server environment variable — remove it from Render's dashboard to fully disable this provider.`);
      }
      setSettings((prev) => ({
        ...prev,
        providers: {
          ...prev.providers,
          [provider]: { ...prev.providers[provider], configured: result.envFallback, keyPreview: result.envFallback ? prev.providers[provider].keyPreview : null },
        },
      }));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  if (loading) return <div className="flex justify-center py-16"><img src="/favicon.png" alt="Loading" className="w-10 h-10 animate-pulse" /></div>;

  const providers = settings?.providers || {};

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p className="text-xs text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600 cursor-pointer text-sm">✕</button>
        </div>
      )}

      {/* Master toggle */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-900">AI Features</p>
            <p className="text-xs text-gray-400 mt-0.5">Toggle all AI-powered features on or off across the platform</p>
          </div>
          <button
            onClick={handleToggle}
            disabled={saving}
            className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${settings?.enabled ? "bg-teal-500" : "bg-gray-300"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${settings?.enabled ? "translate-x-6" : ""}`} />
          </button>
        </div>
        {!settings?.enabled && (
          <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl p-3">
            <p className="text-xs text-amber-800">AI is currently <span className="font-bold">disabled</span>. All AI-powered features will return a 503 error until re-enabled.</p>
          </div>
        )}
      </div>

      {/* Provider selection */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-sm font-bold text-gray-900 mb-1">Active AI Provider</p>
        <p className="text-xs text-gray-400 mb-4">Paste each provider's API key below, then click a card to set it as active.</p>

        <div className="grid sm:grid-cols-2 gap-3">
          {Object.entries(providers).map(([id, info]) => (
            <AIProviderCard
              key={id}
              id={id}
              info={info}
              isActive={settings?.activeProvider === id}
              onActivate={handleProviderChange}
              onSaveKey={saveProviderKey}
              onDeleteKey={deleteProviderKey}
              saving={saving}
            />
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-50 grid sm:grid-cols-2 gap-3 text-[11px] text-gray-400">
          <div><span className="font-medium text-gray-500">Gemini</span> — aistudio.google.com → Get API Key</div>
          <div><span className="font-medium text-gray-500">OpenAI</span> — platform.openai.com → API Keys</div>
          <div><span className="font-medium text-gray-500">Anthropic</span> — console.anthropic.com → API Keys</div>
          <div><span className="font-medium text-gray-500">Mistral</span> — console.mistral.ai → API Keys</div>
        </div>
      </div>
    </div>
  );
};

// ─── AI provider card (mirrors GatewayCard but shows models) ─
const AIProviderCard = ({ id, info, isActive, onActivate, onSaveKey, onDeleteKey, saving }) => {
  const [keyInput, setKeyInput]       = useState("");
  const [showKeyForm, setShowKeyForm] = useState(!info.keyPreview);
  const [keySaving, setKeySaving]     = useState(false);
  const [keyDeleting, setKeyDeleting] = useState(false);

  const handleSave = async (e) => {
    e.stopPropagation();
    if (!keyInput.trim()) return;
    setKeySaving(true);
    try {
      await onSaveKey(id, keyInput.trim());
      setKeyInput("");
      setShowKeyForm(false);
    } finally {
      setKeySaving(false);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm(`Remove the ${info.label} API key? The provider will become unavailable until a new key is added.`)) return;
    setKeyDeleting(true);
    try {
      await onDeleteKey(id);
      setShowKeyForm(true);
    } finally {
      setKeyDeleting(false);
    }
  };

  return (
    <div className={`rounded-xl border-2 transition-all ${
      isActive ? "border-teal-400 bg-teal-50" : info.configured ? "border-gray-100 bg-white" : "border-dashed border-gray-200 bg-gray-50"
    }`}>
      <button
        onClick={() => info.configured && !isActive && onActivate(id)}
        disabled={saving || !info.configured || isActive}
        className={`text-left p-4 w-full rounded-t-xl ${isActive ? "" : info.configured ? "cursor-pointer hover:bg-gray-50/50" : "cursor-default"}`}
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-gray-900">{info.label}</p>
          <div className="flex items-center gap-1.5">
            {isActive && <span className="px-2 py-0.5 rounded-full bg-teal-500 text-white text-[10px] font-bold">ACTIVE</span>}
            <span className={`w-2 h-2 rounded-full ${info.configured ? "bg-teal-500" : "bg-gray-300"}`} />
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 w-8">Fast</span>
            <span className="text-[11px] text-gray-500 font-mono">{info.models?.flash}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 w-8">Pro</span>
            <span className="text-[11px] text-gray-500 font-mono">{info.models?.pro}</span>
          </div>
        </div>
      </button>

      <div className="px-4 pb-4 pt-2 border-t border-gray-100">
        {info.keyPreview && !showKeyForm ? (
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-teal-600 font-mono font-medium">Key: {info.keyPreview}</span>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowKeyForm(true)} className="text-[11px] text-gray-400 hover:text-gray-600 cursor-pointer">Update</button>
              <button onClick={handleDelete} disabled={keyDeleting} className="text-[11px] text-red-400 hover:text-red-600 cursor-pointer disabled:opacity-40">
                {keyDeleting ? "…" : "Delete"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-1.5">
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Paste API key…"
              className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-teal-400"
            />
            <button
              onClick={handleSave}
              disabled={!keyInput.trim() || keySaving}
              className="px-3 py-1.5 rounded-lg bg-teal-500 text-white text-xs font-medium cursor-pointer disabled:opacity-40"
            >
              {keySaving ? "…" : "Save"}
            </button>
            {info.keyPreview && (
              <button onClick={() => { setShowKeyForm(false); setKeyInput(""); }} className="px-2 py-1.5 text-xs text-gray-400 cursor-pointer">✕</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Shared toggle + status atoms ─────────────────────────
const Toggle = ({ on, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${on ? "bg-teal-500" : "bg-gray-300"} disabled:opacity-50`}
  >
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-6" : ""}`} />
  </button>
);

const GatewayCard = ({ id, info, isActive, onActivate, onSaveKey, onDeleteKey, saving }) => {
  const [keyInput, setKeyInput]       = useState("");
  const [showKeyForm, setShowKeyForm] = useState(!info.keyPreview);
  const [keySaving, setKeySaving]     = useState(false);
  const [keyDeleting, setKeyDeleting] = useState(false);

  const handleSave = async (e) => {
    e.stopPropagation();
    if (!keyInput.trim()) return;
    setKeySaving(true);
    try {
      await onSaveKey(id, keyInput.trim());
      setKeyInput("");
      setShowKeyForm(false);
    } finally {
      setKeySaving(false);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm(`Remove the ${info.label} API key? The gateway will become unavailable until a new key is added.`)) return;
    setKeyDeleting(true);
    try {
      await onDeleteKey(id);
      setShowKeyForm(true);
    } finally {
      setKeyDeleting(false);
    }
  };

  return (
    <div className={`rounded-xl border-2 transition-all ${
      isActive ? "border-teal-400 bg-teal-50" : info.configured ? "border-gray-100 bg-white" : "border-dashed border-gray-200 bg-gray-50"
    }`}>
      <button
        onClick={() => info.configured && !isActive && onActivate(id)}
        disabled={saving || !info.configured || isActive}
        className={`text-left p-4 w-full rounded-t-xl ${
          isActive ? "" : info.configured ? "cursor-pointer hover:bg-gray-50/50" : "cursor-default"
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-gray-900">{info.label}</p>
          <div className="flex items-center gap-1.5">
            {isActive && <span className="px-2 py-0.5 rounded-full bg-teal-500 text-white text-[10px] font-bold">ACTIVE</span>}
            <span className={`w-2 h-2 rounded-full ${info.configured ? "bg-teal-500" : "bg-gray-300"}`} />
          </div>
        </div>
        <p className="text-[11px] text-gray-400 mb-1">{info.regions || info.website || ""}</p>
        {info.currencies && (
          <div className="flex flex-wrap gap-1 mb-1">
            {info.currencies.map((c) => (
              <span key={c} className="px-1.5 py-0.5 rounded bg-gray-100 text-[10px] text-gray-600 font-medium">{c}</span>
            ))}
          </div>
        )}
        {info.flow && (
          <p className="text-[10px] text-gray-400 mt-1">{info.flow === "popup" ? "In-app popup" : "Hosted checkout page"}</p>
        )}
      </button>

      <div className="px-4 pb-4 pt-2 border-t border-gray-100">
        {info.keyPreview && !showKeyForm ? (
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-teal-600 font-mono font-medium">Key: {info.keyPreview}</span>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowKeyForm(true)} className="text-[11px] text-gray-400 hover:text-gray-600 cursor-pointer">Update</button>
              <button onClick={handleDelete} disabled={keyDeleting} className="text-[11px] text-red-400 hover:text-red-600 cursor-pointer disabled:opacity-40">
                {keyDeleting ? "…" : "Delete"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-1.5">
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Paste API key…"
              className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-teal-400"
            />
            <button
              onClick={handleSave}
              disabled={!keyInput.trim() || keySaving}
              className="px-3 py-1.5 rounded-lg bg-teal-500 text-white text-xs font-medium cursor-pointer disabled:opacity-40"
            >
              {keySaving ? "…" : "Save"}
            </button>
            {info.keyPreview && (
              <button onClick={() => { setShowKeyForm(false); setKeyInput(""); }} className="px-2 py-1.5 text-xs text-gray-400 cursor-pointer">✕</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Payment settings panel ────────────────────────────────
const PaymentSettingsPanel = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState(null);

  useEffect(() => {
    api.get("/admin/payment-settings")
      .then(setSettings)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const toggle = async () => {
    setSaving(true);
    try { const d = await api.put("/admin/payment-settings", { enabled: !settings.enabled }); setSettings(d); }
    catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  const activate = async (gateway) => {
    setSaving(true); setError(null);
    try { const d = await api.put("/admin/payment-settings", { gateway }); setSettings(d); }
    catch (e) { setError(e.response?.data?.error || e.message); } finally { setSaving(false); }
  };

  const saveGatewayKey = async (gateway, key) => {
    setError(null);
    const result = await api.put("/admin/payment-settings/key", { gateway, key });
    setSettings((prev) => ({
      ...prev,
      gateways: {
        ...prev.gateways,
        [gateway]: { ...prev.gateways[gateway], configured: true, keyPreview: result.keyPreview },
      },
    }));
  };

  const deleteGatewayKey = async (gateway) => {
    setError(null);
    try {
      const result = await api.delete(`/admin/payment-settings/key/${gateway}`);
      if (result.envFallback) {
        const envVar = `${gateway.toUpperCase()}_SECRET_KEY`;
        setError(`DB key removed, but ${envVar} is still set as a server environment variable — remove it from Render's dashboard to fully disable this gateway.`);
      }
      setSettings((prev) => ({
        ...prev,
        gateways: {
          ...prev.gateways,
          [gateway]: { ...prev.gateways[gateway], configured: result.envFallback, keyPreview: result.envFallback ? prev.gateways[gateway].keyPreview : null },
        },
      }));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  if (loading) return <div className="flex justify-center py-16"><img src="/favicon.png" alt="" className="w-10 h-10 animate-pulse" /></div>;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
          <p className="text-xs text-red-700 flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 text-sm cursor-pointer">✕</button>
        </div>
      )}

      {/* Master toggle */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-900">Payment Processing</p>
            <p className="text-xs text-gray-400 mt-0.5">Toggle all payment processing on or off across the platform</p>
          </div>
          <Toggle on={settings?.enabled} onClick={toggle} disabled={saving} />
        </div>
        {!settings?.enabled && (
          <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl p-3">
            <p className="text-xs text-amber-800">Payments are <span className="font-bold">disabled</span>. Users cannot upgrade their plan until re-enabled.</p>
          </div>
        )}
      </div>

      {/* Gateway selection */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-sm font-bold text-gray-900 mb-1">Active Payment Gateway</p>
        <p className="text-xs text-gray-400 mb-4">Paste each gateway's secret key below, then click a card to set it as active.</p>
        <div className="grid sm:grid-cols-3 gap-3">
          {Object.entries(settings?.gateways || {}).map(([id, info]) => (
            <GatewayCard key={id} id={id} info={info} isActive={settings?.activeGateway === id} onActivate={activate} onSaveKey={saveGatewayKey} onDeleteKey={deleteGatewayKey} saving={saving} />
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-50 grid sm:grid-cols-3 gap-3 text-[11px] text-gray-400">
          <div><span className="font-medium text-gray-500">Paystack</span> — paystack.com/developer → API Keys</div>
          <div><span className="font-medium text-gray-500">Stripe</span> — dashboard.stripe.com → Developers → API Keys</div>
          <div><span className="font-medium text-gray-500">Flutterwave</span> — dashboard.flutterwave.com → Settings → API</div>
        </div>
      </div>
    </div>
  );
};

// ─── Integrations panel ────────────────────────────────────
const IntegrationsPanel = () => {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState(null);

  useEffect(() => {
    api.get("/admin/integrations")
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const updateEmail = async (patch) => {
    setSaving(true); setError(null);
    try {
      const result = await api.put("/admin/integrations/email", patch);
      setData((prev) => ({ ...prev, email: { ...prev.email, ...result } }));
    } catch (e) { setError(e.response?.data?.error || e.message); }
    finally { setSaving(false); }
  };

  const saveEmailKey = async (provider, key) => {
    setError(null);
    const result = await api.put("/admin/integrations/email/key", { provider, key });
    setData((prev) => ({
      ...prev,
      email: {
        ...prev.email,
        providers: {
          ...prev.email.providers,
          [provider]: { ...prev.email.providers[provider], configured: true, keyPreview: result.keyPreview },
        },
      },
    }));
  };

  const deleteEmailKey = async (provider) => {
    setError(null);
    try {
      const result = await api.delete(`/admin/integrations/email/key/${provider}`);
      if (result.envFallback) {
        const envVar = `${provider.toUpperCase()}_API_KEY`;
        setError(`DB key removed, but ${envVar} is still set as a server environment variable — remove it from Render's dashboard to fully disable this provider.`);
      }
      setData((prev) => ({
        ...prev,
        email: {
          ...prev.email,
          providers: {
            ...prev.email.providers,
            [provider]: { ...prev.email.providers[provider], configured: result.envFallback, keyPreview: result.envFallback ? prev.email.providers[provider].keyPreview : null },
          },
        },
      }));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const saveSentryKey = async (key) => {
    setError(null);
    await api.put("/admin/integrations/sentry/key", { key });
    setData((prev) => ({ ...prev, sentry: { ...prev.sentry, configured: true } }));
  };

  const deleteSentryKey = async () => {
    setError(null);
    try {
      const result = await api.delete("/admin/integrations/sentry/key");
      if (result.envFallback) {
        setError("DB key removed, but SENTRY_DSN is still set as a server environment variable — remove it from Render's dashboard to fully disable Sentry.");
      }
      setData((prev) => ({ ...prev, sentry: { ...prev.sentry, configured: result.envFallback } }));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const saveFromEmail = async (from) => {
    setError(null);
    await api.put("/admin/integrations/email/from", { from });
    setData((prev) => ({ ...prev, email: { ...prev.email, notifyFromEmail: from } }));
  };

  if (loading) return <div className="flex justify-center py-16"><img src="/favicon.png" alt="" className="w-10 h-10 animate-pulse" /></div>;

  const email = data?.email || {};
  const sentry = data?.sentry || {};

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
          <p className="text-xs text-red-700 flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 text-sm cursor-pointer">✕</button>
        </div>
      )}

      {/* Email provider */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-bold text-gray-900">Email Provider</p>
            <p className="text-xs text-gray-400 mt-0.5">Controls contact form emails and transactional emails</p>
          </div>
          <Toggle on={email.enabled} onClick={() => updateEmail({ enabled: !email.enabled })} disabled={saving} />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {Object.entries(email.providers || {}).map(([id, info]) => (
            <GatewayCard
              key={id} id={id} info={info}
              isActive={email.activeProvider === id}
              onActivate={(p) => updateEmail({ provider: p })}
              onSaveKey={saveEmailKey}
              onDeleteKey={deleteEmailKey}
              saving={saving}
            />
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-50 grid sm:grid-cols-2 gap-3 text-[11px] text-gray-400">
          <div><span className="font-medium text-gray-500">Resend</span> — resend.com → API Keys → Create API Key</div>
          <div><span className="font-medium text-gray-500">SendGrid</span> — app.sendgrid.com → Settings → API Keys</div>
        </div>

        {/* From email address */}
        <div className="mt-4 pt-4 border-t border-gray-50">
          <p className="text-xs font-semibold text-gray-700 mb-1">From email address</p>
          <p className="text-[11px] text-gray-400 mb-2">
            The sender address for verification and notification emails. Must be a verified domain on your email provider.
          </p>
          <FromEmailInput value={email.notifyFromEmail || ""} onSave={saveFromEmail} />
        </div>
      </div>

      {/* Error tracking */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-bold text-gray-900">Sentry — Error Tracking</p>
            <p className="text-xs text-gray-400 mt-0.5">Automatic error capture and performance monitoring</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${sentry.configured ? "bg-teal-100 text-teal-700" : "bg-gray-100 text-gray-500"}`}>
            {sentry.configured ? "Active" : "Not configured"}
          </span>
        </div>
        <SentryKeyInput configured={sentry.configured} onSave={saveSentryKey} onDelete={deleteSentryKey} />
        <p className="text-[11px] text-gray-400 mt-2">sentry.io → your Node.js project → Settings → Client Keys → DSN</p>
      </div>
    </div>
  );
};

// ─── From email input ──────────────────────────────────────
const FromEmailInput = ({ value, onSave }) => {
  const [input, setInput]   = useState(value || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  const handleSave = async () => {
    if (!input.trim()) return;
    setSaving(true);
    try {
      await onSave(input.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="email"
        value={input}
        onChange={(e) => { setInput(e.target.value); setSaved(false); }}
        placeholder="Seevv <notifications@yourdomain.com>"
        className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400/30"
        onKeyDown={(e) => e.key === "Enter" && handleSave()}
      />
      <button
        onClick={handleSave}
        disabled={saving || !input.trim()}
        className="text-xs px-3 py-2 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-800 disabled:opacity-50 cursor-pointer transition-colors shrink-0"
      >
        {saving ? "Saving…" : saved ? "Saved ✓" : "Save"}
      </button>
    </div>
  );
};

// ─── Sentry key input ──────────────────────────────────────
const SentryKeyInput = ({ configured, onSave, onDelete }) => {
  const [keyInput, setKeyInput]       = useState("");
  const [showForm, setShowForm]       = useState(!configured);
  const [saving, setSaving]           = useState(false);
  const [deleting, setDeleting]       = useState(false);

  const handleSave = async () => {
    if (!keyInput.trim()) return;
    setSaving(true);
    try { await onSave(keyInput.trim()); setKeyInput(""); setShowForm(false); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm("Remove the Sentry DSN? Error tracking will be disabled.")) return;
    setDeleting(true);
    try { await onDelete(); setShowForm(true); }
    finally { setDeleting(false); }
  };

  if (configured && !showForm) {
    return (
      <div className="flex items-center gap-3 mt-1">
        <span className="text-[11px] text-teal-600 font-mono font-medium">DSN configured</span>
        <button onClick={() => setShowForm(true)} className="text-[11px] text-gray-400 hover:text-gray-600 cursor-pointer">Update</button>
        <button onClick={handleDelete} disabled={deleting} className="text-[11px] text-red-400 hover:text-red-600 cursor-pointer disabled:opacity-40">
          {deleting ? "…" : "Delete"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2 mt-1">
      <input
        type="password"
        value={keyInput}
        onChange={(e) => setKeyInput(e.target.value)}
        placeholder="https://...@sentry.io/..."
        className="flex-1 text-xs px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-teal-400"
      />
      <button
        onClick={handleSave}
        disabled={!keyInput.trim() || saving}
        className="px-4 py-2 rounded-lg bg-teal-500 text-white text-xs font-medium cursor-pointer disabled:opacity-40"
      >
        {saving ? "…" : "Save"}
      </button>
      {configured && (
        <button onClick={() => { setShowForm(false); setKeyInput(""); }} className="px-2 text-xs text-gray-400 cursor-pointer">✕</button>
      )}
    </div>
  );
};


// ─── Revenue panel ────────────────────────────────────────
const RevenuePanel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get("/admin/revenue").then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!data) return <p className="text-sm text-gray-400 py-8 text-center">Revenue data unavailable</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total revenue" value={`$${(data.totalRevenue / 100).toFixed(2)}`} />
        <StatCard label="Last 30 days"  value={`$${(data.recentRevenue / 100).toFixed(2)}`} />
        <StatCard label="Paid users"    value={data.paidUsers} />
        <StatCard label="Promos used"   value={data.promosApplied} sub={`$${(data.totalDiscount / 100).toFixed(2)} discounted`} />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Revenue by plan</p>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(data.byPlan || {}).map(([plan, amount]) => (
            <div key={plan} className="text-center p-3 bg-gray-50 rounded-xl">
              <p className="text-lg font-bold text-gray-900">${(amount / 100).toFixed(0)}</p>
              <p className="text-[10px] text-gray-400 capitalize mt-0.5">{plan.replace("_", " ")}</p>
            </div>
          ))}
        </div>
      </div>
      {data.recentEvents?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 px-5 py-4 border-b border-gray-100">Recent transactions</p>
          <div className="divide-y divide-gray-50">
            {data.recentEvents.map((e, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-xs font-semibold text-gray-900">{e.plan}</p>
                  <p className="text-[10px] text-gray-400">{e.gateway} · {new Date(e.created_at).toLocaleDateString()}</p>
                </div>
                <p className="text-sm font-bold text-gray-900">{e.currency} {(e.amount / 100).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Audit logs panel ─────────────────────────────────────
const AuditLogsPanel = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get("/admin/audit-logs?limit=100").then((d) => setLogs(d.logs || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 px-5 py-4 border-b border-gray-100">Admin audit trail</p>
      {logs.length === 0 ? (
        <p className="text-sm text-gray-400 py-10 text-center">No audit events recorded yet</p>
      ) : (
        <div className="divide-y divide-gray-50 max-h-[70vh] overflow-y-auto">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-4 px-5 py-3">
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-gray-400 text-[10px] font-bold">
                {log.admin?.full_name?.[0] || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900">{log.action}</p>
                <p className="text-[10px] text-gray-400 truncate">{log.target_type} · {log.target_id} · by {log.admin?.full_name || log.admin?.email || "Admin"}</p>
              </div>
              <p className="text-[10px] text-gray-300 shrink-0">{new Date(log.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Moderation panel ─────────────────────────────────────
const ModerationPanel = () => {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("pending");

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/moderation?status=${status}`).then((d) => setFlags(d.flags || [])).catch(() => {}).finally(() => setLoading(false));
  }, [status]);

  const handleAction = async (id, newStatus) => {
    try {
      await api.patch(`/admin/moderation/${id}`, { status: newStatus });
      setFlags((prev) => prev.filter((f) => f.id !== id));
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {["pending", "reviewed", "actioned", "dismissed"].map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${status === s ? "bg-brand-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-brand-300"}`}
          >{s.charAt(0).toUpperCase() + s.slice(1)}</button>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : flags.length === 0 ? (
          <p className="text-sm text-gray-400 py-10 text-center">No {status} flags</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {flags.map((f) => (
              <div key={f.id} className="flex items-start justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-900">{f.content_type} · {f.content_id}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{f.reason} · reported by {f.reporter?.full_name || "Unknown"}</p>
                  <p className="text-[10px] text-gray-300 mt-0.5">{new Date(f.created_at).toLocaleDateString()}</p>
                </div>
                {status === "pending" && (
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleAction(f.id, "actioned")} className="px-2.5 py-1 text-[10px] font-semibold bg-red-50 text-red-600 rounded-lg cursor-pointer hover:bg-red-100">Action</button>
                    <button onClick={() => handleAction(f.id, "dismissed")} className="px-2.5 py-1 text-[10px] font-semibold bg-gray-100 text-gray-600 rounded-lg cursor-pointer hover:bg-gray-200">Dismiss</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Feature flags panel ──────────────────────────────────
const FeatureFlagsPanel = () => {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/feature-flags").then((d) => setFlags(d.flags || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const toggle = async (key, enabled) => {
    setFlags((prev) => prev.map((f) => f.key === key ? { ...f, enabled } : f));
    await api.patch(`/admin/feature-flags/${key}`, { enabled }).catch(() => {});
  };

  if (loading) return <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 px-5 py-4 border-b border-gray-100">Feature flags</p>
      {flags.length === 0 ? (
        <p className="text-sm text-gray-400 py-10 text-center">No feature flags configured</p>
      ) : (
        <div className="divide-y divide-gray-50">
          {flags.map((f) => (
            <div key={f.key} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">{f.key}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{f.applies_to || "all users"} · {f.rollout_pct ?? 100}% rollout</p>
              </div>
              <button
                onClick={() => toggle(f.key, !f.enabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${f.enabled ? "bg-teal-500" : "bg-gray-200"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${f.enabled ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Organizations panel ──────────────────────────────────
const OrganizationsPanel = () => {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    api.get("/admin/organizations").then((d) => setOrgs(d.organizations || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const createOrg = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const org = await api.post("/admin/organizations", { name: newName.trim() });
      setOrgs((prev) => [org, ...prev]);
      setNewName("");
    } catch { /* ignore */ } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex gap-3">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && createOrg()}
          placeholder="Organization name"
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600"
        />
        <button
          onClick={createOrg}
          disabled={creating || !newName.trim()}
          className="px-4 py-2 bg-brand-600 text-white text-xs font-semibold rounded-xl hover:bg-brand-800 cursor-pointer disabled:opacity-50"
        >{creating ? "Creating…" : "Create"}</button>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {orgs.length === 0 ? (
          <p className="text-sm text-gray-400 py-10 text-center">No organizations yet</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {orgs.map((org) => (
              <div key={org.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{org.name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{org.domain || "No domain"} · {org.plan || "starter"}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${org.active !== false ? "bg-teal-50 text-teal-700" : "bg-gray-100 text-gray-400"}`}>
                  {org.active !== false ? "Active" : "Inactive"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── White-label panel ─────────────────────────────────────
const WhitelabelPanel = () => {
  const [settings, setSettings] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get("/whitelabel").then((d) => setSettings(d.settings || {})).catch(() => {});
  }, []);

  const set = (key, val) => setSettings((p) => ({ ...p, [key]: val }));

  const save = async () => {
    setSaving(true);
    try {
      await api.patch("/whitelabel", settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { alert(e.message); } finally { setSaving(false); }
  };

  const fields = [
    { key: "whitelabel_enabled",      label: "White-label enabled", type: "toggle" },
    { key: "whitelabel_company_name", label: "Company name",        type: "text", placeholder: "Acme Corp" },
    { key: "whitelabel_logo_url",     label: "Logo URL",            type: "text", placeholder: "https://..." },
    { key: "whitelabel_primary_color",label: "Primary colour",      type: "text", placeholder: "#033876" },
    { key: "whitelabel_support_email",label: "Support email",       type: "text", placeholder: "support@acme.com" },
    { key: "whitelabel_domain",       label: "Custom domain",       type: "text", placeholder: "careers.acme.com" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-bold text-gray-900">White-label settings</h2>
        <p className="text-xs text-gray-400 mt-0.5">Customise Seevv's branding for enterprise clients</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        {fields.map(({ key, label, type, placeholder }) => (
          <div key={key} className="flex items-center justify-between gap-6 px-5 py-4">
            <label className="text-sm font-medium text-gray-800">{label}</label>
            {type === "toggle" ? (
              <button
                onClick={() => set(key, settings[key] === "true" ? "false" : "true")}
                className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${settings[key] === "true" ? "bg-brand-600" : "bg-gray-200"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings[key] === "true" ? "translate-x-5" : ""}`} />
              </button>
            ) : (
              <input
                value={settings[key] || ""}
                onChange={(e) => set(key, e.target.value)}
                placeholder={placeholder}
                className="w-64 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving}
          className="px-5 py-2 bg-brand-600 text-white text-sm font-semibold rounded-xl cursor-pointer hover:bg-brand-800 disabled:opacity-50"
        >{saving ? "Saving…" : "Save settings"}</button>
        {saved && <p className="text-xs text-teal-600 font-semibold">✓ Saved</p>}
      </div>
    </div>
  );
};

// ─── ATS panel ─────────────────────────────────────────────
const PROVIDERS = [
  { id: "greenhouse", name: "Greenhouse", docs: "https://developers.greenhouse.io" },
  { id: "lever",      name: "Lever",      docs: "https://hire.lever.co/developer" },
  { id: "workday",    name: "Workday",    docs: "https://community.workday.com/api" },
  { id: "ashby",      name: "Ashby",      docs: "https://developers.ashbyhq.com" },
  { id: "teamtailor", name: "Teamtailor", docs: "https://docs.teamtailor.com" },
];

const AtsPanel = () => {
  const [integrations, setIntegrations] = useState([]);
  const [editing, setEditing] = useState(null);
  const [apiKey, setApiKey] = useState("");
  const [testing, setTesting] = useState(null);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    api.get("/ats").then((d) => setIntegrations(d.integrations || [])).catch(() => {});
  }, []);

  const getInt = (id) => integrations.find((i) => i.provider === id) || { provider: id, enabled: false, apiKey: null };

  const toggle = async (id) => {
    const cur = getInt(id);
    await api.patch(`/ats/${id}`, { enabled: !cur.enabled }).catch(() => {});
    setIntegrations((p) => p.map((i) => i.provider === id ? { ...i, enabled: !i.enabled } : i));
  };

  const saveKey = async (id) => {
    if (!apiKey.trim()) return;
    await api.patch(`/ats/${id}`, { apiKey: apiKey.trim(), enabled: true }).catch(() => {});
    setIntegrations((p) => p.map((i) => i.provider === id ? { ...i, apiKey: "••••••••", enabled: true } : i));
    setEditing(null); setApiKey("");
  };

  const test = async (id) => {
    setTesting(id);
    try {
      const r = await api.post(`/ats/${id}/test`);
      setTestResult({ id, ok: r.success, msg: r.message });
    } catch (e) { setTestResult({ id, ok: false, msg: e.message }); } finally { setTesting(null); }
    setTimeout(() => setTestResult(null), 5000);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-bold text-gray-900">ATS integrations</h2>
        <p className="text-xs text-gray-400 mt-0.5">Connect Seevv to your applicant tracking system</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        {PROVIDERS.map(({ id, name }) => {
          const int = getInt(id);
          return (
            <div key={id} className="px-5 py-4 space-y-2">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{name}</p>
                  <p className="text-[10px] text-gray-400">{int.apiKey ? "API key configured" : "No API key set"}</p>
                </div>
                <div className="flex items-center gap-3">
                  {int.apiKey && (
                    <button onClick={() => test(id)} disabled={testing === id}
                      className="text-xs text-brand-600 hover:text-brand-800 cursor-pointer font-medium disabled:opacity-50"
                    >{testing === id ? "Testing…" : "Test"}</button>
                  )}
                  <button onClick={() => { setEditing(id); setApiKey(""); }}
                    className="text-xs text-gray-500 hover:text-brand-600 cursor-pointer">
                    {int.apiKey ? "Update key" : "Add key"}
                  </button>
                  <button onClick={() => toggle(id)}
                    className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${int.enabled ? "bg-brand-600" : "bg-gray-200"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${int.enabled ? "translate-x-4" : ""}`} />
                  </button>
                </div>
              </div>
              {testResult?.id === id && (
                <p className={`text-xs font-medium ${testResult.ok ? "text-teal-600" : "text-red-500"}`}>{testResult.msg}</p>
              )}
              {editing === id && (
                <div className="flex gap-2 mt-2">
                  <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} type="password"
                    placeholder="Paste API key…"
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                  />
                  <button onClick={() => saveKey(id)} disabled={!apiKey.trim()}
                    className="px-3 py-1.5 bg-brand-600 text-white text-xs font-semibold rounded-lg cursor-pointer hover:bg-brand-700 disabled:opacity-50"
                  >Save</button>
                  <button onClick={() => setEditing(null)} className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer px-2">Cancel</button>
                </div>
              )}
            </div>
          );
        })}
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

  const handleRejectVerif = useCallback(async (requestId, reason = "") => {
    const req = pendingVerifications.find((r) => r.id === requestId);
    if (!req) return;
    try {
      await api.patch("/admin/verification-requests/reject", { userId: req.user_id, badgeType: req.badge_type, reason });
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
        { id: "revenue",        label: "Revenue",        icon: <Icon d={["M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"]} /> },
        { id: "audit_logs",     label: "Audit Logs",     icon: <Icon d={["M9 12h6", "M9 16h6", "M9 8h6", "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"]} /> },
      ],
    },
    {
      group: "Moderation",
      items: [
        { id: "moderation",    label: "Flagged Content", icon: <Icon d={["M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z", "M12 9v4", "M12 17h.01"]} /> },
        { id: "feature_flags", label: "Feature Flags",   icon: <Icon d={["M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z", "M4 22v-7"]} /> },
        { id: "organizations", label: "Organizations",   icon: <Icon d={["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2", "M23 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"]} /> },
      ],
    },
    {
      group: "Settings",
      items: [
        { id: "ai_settings",      label: "AI Configuration",  icon: <Icon d={["M12 2a4 4 0 0 0-4 4v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z"]} /> },
        { id: "payment_settings", label: "Payment Gateway",   icon: <Icon d={["M2 9h20M2 15h20M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"]} /> },
        { id: "integrations",     label: "Integrations",      icon: <Icon d={["M4 6h16M4 12h16M4 18h16"]} /> },
        { id: "whitelabel",       label: "White-label",        icon: <Icon d={["M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"]} /> },
        { id: "ats",              label: "ATS integrations",   icon: <Icon d={["M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71", "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"]} /> },
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
    revenue:        "Revenue Dashboard",
    audit_logs:     "Audit Logs",
    moderation:     "Flagged Content",
    feature_flags:  "Feature Flags",
    organizations:  "Organizations",
    ai_settings:      "AI Configuration",
    payment_settings: "Payment Gateway",
    integrations:     "Integrations",
    whitelabel:       "White-label Settings",
    ats:              "ATS Integrations",
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
                {section === "ai_settings"      && "Toggle AI on/off and switch providers"}
                {section === "payment_settings" && "Toggle payments on/off and switch gateway"}
                {section === "integrations"     && "Email provider, error tracking, and other APIs"}
                {section === "whitelabel"       && "Custom branding for enterprise clients"}
                {section === "ats"              && "Connect to applicant tracking systems"}
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

          {/* ── AI Settings ────────────────────────── */}
          {section === "ai_settings"      && <AISettingsPanel />}
          {section === "payment_settings" && <PaymentSettingsPanel />}
          {section === "integrations"     && <IntegrationsPanel />}

          {/* ── Revenue ─────────────────────────────── */}
          {section === "revenue" && <RevenuePanel />}

          {/* ── Audit Logs ──────────────────────────── */}
          {section === "audit_logs" && <AuditLogsPanel />}

          {/* ── Moderation ──────────────────────────── */}
          {section === "moderation" && <ModerationPanel />}

          {/* ── Feature Flags ───────────────────────── */}
          {section === "feature_flags" && <FeatureFlagsPanel />}

          {/* ── Organizations ───────────────────────── */}
          {section === "organizations" && <OrganizationsPanel />}

          {/* ── White-label ──────────────────────────── */}
          {section === "whitelabel" && <WhitelabelPanel />}

          {/* ── ATS ─────────────────────────────────── */}
          {section === "ats" && <AtsPanel />}

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
