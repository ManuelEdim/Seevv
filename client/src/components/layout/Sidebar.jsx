import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store";
import { signOut } from "@/lib/auth";
import { hasFeature } from "@/lib/features";

// ─── Nav structure ─────────────────────────────────────────
const navGroups = [
  {
    label: null,
    items: [
      {
        label: "Dashboard",
        path: "/dashboard",
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
          </svg>
        ),
      },
      {
        label: "Deep Decoder",
        path: "/decoder",
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
        ),
      },
      {
        label: "My CVs",
        path: "/cv",
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        ),
      },
      {
        label: "Cover Letter",
        path: "/cover-letter",
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        ),
      },
    ],
  },
  {
    label: null,
    items: [
      {
        label: "Achievement Journal",
        path: "/journal",
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Intelligence",
    items: [
      {
        label: "Gap Roadmap",
        path: "/gap-roadmap",
        feature: "gap_roadmap",
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12h4l3-9 4 18 3-9h4" />
          </svg>
        ),
      },
      {
        label: "Transition Mode",
        path: "/transition",
        feature: "transition_mode",
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
          </svg>
        ),
      },
      {
        label: "Speed Mode",
        path: "/speed-mode",
        feature: "speed_mode",
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        ),
      },
      {
        label: "Proof of Work",
        path: "/proof-of-work",
        feature: "proof_of_work",
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        ),
      },
      {
        label: "Skills Graph",
        path: "/skills",
        feature: "skills_graph",
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Jobs",
    items: [
      {
        label: "Job Board",
        path: "/jobs",
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
          </svg>
        ),
      },
      {
        label: "App Tracker",
        path: "/tracker",
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        ),
      },
      {
        label: "Apply Assist",
        path: "/apply-assist",
        feature: "apply_assist",
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        ),
      },
      {
        label: "Rejection Intel",
        path: "/rejection-intel",
        feature: "rejection_intel",
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
          </svg>
        ),
      },
      {
        label: "Recruiter Outreach",
        path: "/recruiter-outreach",
        feature: "recruiter_outreach",
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        ),
      },
      {
        label: "Company Intel",
        path: "/company-intel",
        feature: "company_intel",
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Interview",
    items: [
      {
        label: "Interview Prep",
        path: "/interview-prep",
        feature: "interview_prep",
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        ),
      },
      {
        label: "Mock Interview",
        path: "/mock-interview",
        feature: "mock_interview",
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        ),
      },
      {
        label: "Analytics",
        path: "/analytics",
        feature: "analytics",
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        ),
      },
      {
        label: "Negotiation Coach",
        path: "/negotiation-coach",
        feature: "negotiation_coach",
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Personalise",
    items: [
      {
        label: "Voice Mirror",
        path: "/voice-mirror",
        feature: "voice_mirroring",
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        ),
      },
      {
        label: "Verification",
        path: "/verification",
        feature: "verification",
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" />
          </svg>
        ),
      },
      {
        label: "Custom Branding",
        path: "/branding",
        feature: "custom_branding",
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="13.5" cy="6.5" r="2.5" />
            <path d="M17 18H7l2-7h6l2 7z" />
            <path d="M12 18v4" /><path d="M10 22h4" />
          </svg>
        ),
      },
      {
        label: "API Access",
        path: "/api-access",
        feature: "api_access",
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        ),
      },
    ],
  },
  {
    label: null,
    items: [
      {
        label: "Profile",
        path: "/profile",
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        ),
      },
    ],
  },
];

const LockIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 ml-auto opacity-30">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

// ─── Group label ───────────────────────────────────────────
const GroupLabel = ({ label }) => (
  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] px-3 mb-1 mt-1" style={{ color: "var(--sidebar-group-label)" }}>
    {label}
  </p>
);

// ─── Nav item ──────────────────────────────────────────────
const NavItem = ({ item, onClose, plan, overrides, role }) => {
  const isLocked = item.feature && role !== "admin" && !hasFeature(plan, item.feature, overrides);

  return (
    <NavLink
      to={item.path}
      onClick={isLocked ? (e) => e.preventDefault() : onClose}
      data-tour={item.path}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] font-medium transition-colors duration-150 ${
          isActive ? "nav-active" : isLocked ? "nav-locked" : "nav-inactive"
        }`
      }
    >
      <span className="shrink-0 opacity-80">{item.icon}</span>
      <span className="flex-1 leading-none">{item.label}</span>
      {isLocked && <LockIcon />}
    </NavLink>
  );
};

// ─── Plan badge ────────────────────────────────────────────
const PLAN_COLORS = {
  free:     "bg-white/8 text-white/50",
  starter:  "bg-teal-400/20 text-teal-300",
  pro:      "bg-amber-400/20 text-amber-300",
  pro_plus: "bg-purple-400/20 text-purple-300",
};
const PLAN_LABELS = { free: "Free", starter: "Starter", pro: "Pro", pro_plus: "Pro+" };

// ─── Sidebar ───────────────────────────────────────────────
const Sidebar = ({ isOpen, onClose }) => {
  const navigate  = useNavigate();
  const user      = useAuthStore((s) => s.user);
  const profile   = useAuthStore((s) => s.profile);

  const plan      = profile?.plan || "free";
  const role      = profile?.role || "user";
  const overrides = profile?.feature_overrides || {};

  const handleSignOut = async () => {
    try { await signOut(); navigate("/"); }
    catch (e) { console.error("Sign out error:", e); }
  };

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || "??";

  const displayName = user?.user_metadata?.full_name || profile?.full_name || "User";

  const asideBase = "fixed left-0 top-0 h-screen w-55 flex flex-col z-40 transition-transform duration-300";
  const asideVisible = isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0";

  // ── Recruiter sidebar ──────────────────────────────────────
  if (role === "recruiter") {
    return (
      <aside
        className={`${asideBase} ${asideVisible}`}
        style={{ background: "var(--sidebar-bg)", borderRight: "1px solid var(--sidebar-border)" }}
      >
        <div className="h-14 px-5 flex items-center justify-between shrink-0" style={{ borderBottom: "1px solid var(--sidebar-border)" }}>
          <img src="/logo.png" alt="Seevv" className="h-8 object-contain" />
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg transition-colors cursor-pointer" style={{ color: "var(--sidebar-nav-text)" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-0.5">
          <GroupLabel label="Recruiter" />
          <NavLink to="/recruiter" onClick={onClose} className={({ isActive }) => `flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] font-medium transition-colors ${isActive ? "nav-active" : "nav-inactive"}`}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Recruiter Portal
          </NavLink>
          <NavLink to="/profile" onClick={onClose} className={({ isActive }) => `flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] font-medium transition-colors ${isActive ? "nav-active" : "nav-inactive"}`}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
            Profile
          </NavLink>
        </nav>

        <SidebarFooter user={user} profile={profile} initials={initials} displayName={displayName} plan={plan} role={role} onSignOut={handleSignOut} onNavigate={navigate} onClose={onClose} />
      </aside>
    );
  }

  return (
    <aside
      className={`${asideBase} ${asideVisible}`}
      style={{ background: "var(--sidebar-bg)", borderRight: "1px solid var(--sidebar-border)" }}
    >
      {/* Brand header */}
      <div className="h-14 px-5 flex items-center justify-between shrink-0" style={{ borderBottom: "1px solid var(--sidebar-border)" }}>
        <img src="/logo.png" alt="Seevv" className="h-8 object-contain" />
        <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg transition-colors cursor-pointer" style={{ color: "var(--sidebar-nav-text)" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-3">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {group.label && <GroupLabel label={group.label} />}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem key={item.path} item={item} onClose={onClose} plan={plan} role={role} overrides={overrides} />
              ))}
            </div>
          </div>
        ))}

        {/* Recruiter / Admin links */}
        {(role === "recruiter" || role === "admin") && (
          <div>
            <GroupLabel label="Recruiter" />
            <div className="space-y-0.5">
              <NavLink to="/recruiter" onClick={onClose} className={({ isActive }) => `flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] font-medium transition-colors ${isActive ? "nav-active" : "nav-inactive"}`}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Recruiter Portal
              </NavLink>
            </div>
          </div>
        )}

        {role === "admin" && (
          <div>
            <GroupLabel label="Admin" />
            <div className="space-y-0.5">
              <NavLink to="/admin" onClick={onClose} className={({ isActive }) => `flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] font-medium transition-colors ${isActive ? "nav-active" : "nav-inactive"}`}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Admin Dashboard
              </NavLink>
            </div>
          </div>
        )}
      </nav>

      <SidebarFooter user={user} profile={profile} initials={initials} displayName={displayName} plan={plan} role={role} onSignOut={handleSignOut} onNavigate={navigate} onClose={onClose} />
    </aside>
  );
};

// ─── Sidebar footer (shared) ───────────────────────────────
const SidebarFooter = ({ initials, displayName, user, plan, role, onSignOut, onNavigate, onClose }) => (
  <div className="px-3 pb-4 pt-3 space-y-2" style={{ borderTop: "1px solid var(--sidebar-divider)" }}>
    {/* Upgrade CTA */}
    {role !== "admin" && plan !== "pro_plus" && (
      <button
        onClick={() => { onNavigate("/pricing"); onClose?.(); }}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-semibold text-teal-300 transition-colors cursor-pointer"
        style={{ background: "rgba(29,158,117,0.15)" }}
        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(29,158,117,0.22)"}
        onMouseLeave={(e) => e.currentTarget.style.background = "rgba(29,158,117,0.15)"}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        Upgrade plan
      </button>
    )}

    {/* User row */}
    <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg">
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold" style={{ background: "var(--sidebar-avatar-bg)", color: "var(--sidebar-nav-hover-text)" }}>
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[12px] font-medium truncate" style={{ color: "var(--sidebar-user-text)" }}>{displayName}</p>
          <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${PLAN_COLORS[plan] || PLAN_COLORS.free}`}>
            {PLAN_LABELS[plan] || plan}
          </span>
        </div>
        <p className="text-[11px] truncate" style={{ color: "var(--sidebar-user-sub)" }}>{user?.email}</p>
      </div>
    </div>

    {/* Sign out */}
    <button
      onClick={onSignOut}
      className="w-full flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[12px] transition-colors cursor-pointer"
      style={{ color: "var(--sidebar-user-sub)" }}
      onMouseEnter={(e) => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = "var(--sidebar-user-sub)"; e.currentTarget.style.background = "transparent"; }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      Sign out
    </button>
  </div>
);

export default Sidebar;
