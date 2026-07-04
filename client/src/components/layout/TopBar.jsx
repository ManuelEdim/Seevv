import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuthStore } from "@/store";

const pageTitles = {
  "/dashboard":         { title: "Dashboard",          subtitle: "Your job targets and CV performance" },
  "/decoder":           { title: "Deep Decoder",        subtitle: "Decode what a company actually needs" },
  "/cv":                { title: "My CVs",              subtitle: "Upload and manage your CV versions" },
  "/cover-letter":      { title: "Cover Letter",        subtitle: "Generate tailored cover letters" },
  "/profile":           { title: "Profile",             subtitle: "Account settings and preferences" },
  "/gap-roadmap":       { title: "Gap Roadmap",         subtitle: "Bridge your skill gaps" },
  "/transition":        { title: "Transition Mode",     subtitle: "Plan your career move" },
  "/speed-mode":        { title: "Speed Mode",          subtitle: "Optimise for quick applications" },
  "/proof-of-work":     { title: "Proof of Work",       subtitle: "Substantiate your achievements" },
  "/skills":            { title: "Skills Graph",        subtitle: "Visualise your skill set" },
  "/jobs":              { title: "Job Board",           subtitle: "Browse live opportunities" },
  "/tracker":           { title: "App Tracker",         subtitle: "Track your pipeline" },
  "/apply-assist":      { title: "Apply Assist",        subtitle: "Smart application assistance" },
  "/rejection-intel":   { title: "Rejection Intel",     subtitle: "Learn from every setback" },
  "/recruiter-outreach":{ title: "Recruiter Outreach",  subtitle: "Craft outreach that gets replies" },
  "/company-intel":     { title: "Company Intel",       subtitle: "Research any employer deeply" },
  "/interview-prep":    { title: "Interview Prep",      subtitle: "Prepare with targeted questions" },
  "/mock-interview":    { title: "Mock Interview",      subtitle: "Practice under real conditions" },
  "/analytics":         { title: "Analytics",           subtitle: "Track your interview performance" },
  "/negotiation-coach": { title: "Negotiation Coach",   subtitle: "Get the salary you deserve" },
  "/voice-mirror":      { title: "Voice Mirror",        subtitle: "Capture your authentic tone" },
  "/verification":      { title: "Verification",        subtitle: "Validate your credentials" },
  "/branding":          { title: "Custom Branding",     subtitle: "Personalise your documents" },
  "/api-access":        { title: "API Access",          subtitle: "Integrate Seevv into your tools" },
  "/recruiter":         { title: "Recruiter Portal",    subtitle: "Discover and shortlist candidates" },
  "/admin":             { title: "Admin Dashboard",     subtitle: "Platform management" },
};

const timeAgo = (dateStr) => {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const NotifPanel = ({ notifications, onClose }) => (
  <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl shadow-lg border overflow-hidden z-50"
    style={{ background: "var(--topbar-bg)", borderColor: "var(--topbar-border)", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
  >
    <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--topbar-border)" }}>
      <span className="text-sm font-semibold" style={{ color: "var(--topbar-title)" }}>Notifications</span>
      <button onClick={onClose} className="p-1 rounded-lg transition-colors cursor-pointer" style={{ color: "var(--topbar-icon)" }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>

    <div className="max-h-72 overflow-y-auto">
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "rgba(0,0,0,0.04)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--topbar-icon)" }}>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <p className="text-sm font-medium" style={{ color: "var(--topbar-sub)" }}>All caught up</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--topbar-icon)" }}>We'll let you know when something happens</p>
        </div>
      ) : (
        notifications.map((n) => (
          <div key={n.id} className="flex items-start gap-3 px-4 py-3" style={{ borderBottom: "1px solid var(--topbar-border)" }}>
            <div className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${n.status === "approved" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
              {n.status === "approved" ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] leading-snug" style={{ color: "var(--topbar-title)" }}>
                Your <span className="font-semibold">{n.badgeLabel}</span> badge was{" "}
                <span className={`font-semibold ${n.status === "approved" ? "text-emerald-600" : "text-red-500"}`}>{n.status}</span>.
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--topbar-icon)" }}>{timeAgo(n.date)}</p>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

const TopBar = ({ onMenuClick, onSearchClick }) => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const profile   = useAuthStore((s) => s.profile);
  const [panelOpen, setPanelOpen] = useState(false);
  const wrapperRef = useRef(null);
  const { notifications, unreadCount, markAllRead } = useNotifications();

  const current = pageTitles[location.pathname] || { title: "Seevv", subtitle: "" };

  useEffect(() => {
    const handler = (e) => { if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setPanelOpen(false); };
    if (panelOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [panelOpen]);

  const handleBellClick = () => {
    const opening = !panelOpen;
    setPanelOpen(opening);
    if (opening && unreadCount > 0) markAllRead();
  };

  return (
    <header
      className="h-14 flex items-center px-4 lg:px-5 gap-3 shrink-0"
      style={{ background: "var(--topbar-bg)", borderBottom: "1px solid var(--topbar-border)" }}
    >
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg transition-colors cursor-pointer"
        style={{ color: "var(--topbar-icon)" }}
        aria-label="Open menu"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-[15px] font-semibold leading-none truncate" style={{ color: "var(--topbar-title)" }}>
          {current.title}
        </h1>
        {current.subtitle && (
          <p className="text-[11px] mt-0.5 truncate hidden sm:block" style={{ color: "var(--topbar-sub)" }}>
            {current.subtitle}
          </p>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1">
        {/* Search button */}
        <button
          onClick={onSearchClick}
          title="Search (⌘K)"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] transition-colors cursor-pointer border"
          style={{ color: "var(--topbar-icon)", borderColor: "var(--topbar-border)" }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <span>Search</span>
          <kbd className="ml-0.5 px-1 text-[9px] bg-gray-100 rounded font-mono" style={{ color: "var(--topbar-icon)" }}>⌘K</kbd>
        </button>

        {/* Pricing link — non-admin, non-pro_plus */}
        {profile && profile.role !== "admin" && profile.plan !== "pro_plus" && (
          <button
            onClick={() => navigate("/pricing")}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold text-teal-600 bg-teal-50 hover:bg-teal-100 transition-colors cursor-pointer"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Upgrade
          </button>
        )}

        {/* Notification bell */}
        <div className="relative" ref={wrapperRef}>
          <button
            onClick={handleBellClick}
            className="relative p-2 rounded-xl transition-colors cursor-pointer"
            style={{ color: "var(--topbar-icon)" }}
            onMouseEnter={(e) => e.currentTarget.style.color = "var(--topbar-icon-hover)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "var(--topbar-icon)"}
            title="Notifications"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {panelOpen && <NotifPanel notifications={notifications} onClose={() => setPanelOpen(false)} />}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
