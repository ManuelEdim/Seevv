import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";

const pageTitles = {
  "/dashboard": {
    title: "Dashboard",
    subtitle: "Your job targets and CV performance",
  },
  "/decoder": {
    title: "Deep Decoder",
    subtitle: "Decode what a company actually needs",
  },
  "/cv": { title: "My CVs", subtitle: "Upload and manage your CV versions" },
  "/cover-letter": {
    title: "Cover Letter",
    subtitle: "Generate tailored cover letters",
  },
  "/profile": {
    title: "Profile",
    subtitle: "Your account settings and preferences",
  },
};

const timeAgo = (dateStr) => {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const NotifPanel = ({ notifications, onClose }) => (
  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
      <span className="text-sm font-semibold text-gray-900">Notifications</span>
      <button
        onClick={onClose}
        className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>

    <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mb-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">No notifications yet</p>
          <p className="text-xs text-gray-400 mt-0.5">
            We'll let you know when something happens
          </p>
        </div>
      ) : (
        notifications.map((n) => (
          <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
            <div
              className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                n.status === "approved"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-red-50 text-red-500"
              }`}
            >
              {n.status === "approved" ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800 leading-snug">
                Your{" "}
                <span className="font-semibold">{n.badgeLabel}</span>{" "}
                badge was{" "}
                <span className={n.status === "approved" ? "text-emerald-600 font-semibold" : "text-red-500 font-semibold"}>
                  {n.status}
                </span>
                .
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">{timeAgo(n.date)}</p>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

const TopBar = ({ onMenuClick }) => {
  const location = useLocation();
  const [panelOpen, setPanelOpen] = useState(false);
  const wrapperRef = useRef(null);
  const { notifications, unreadCount, markAllRead } = useNotifications();

  const current = pageTitles[location.pathname] || {
    title: "Seevv",
    subtitle: "",
  };

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setPanelOpen(false);
      }
    };
    if (panelOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [panelOpen]);

  const handleBellClick = () => {
    const opening = !panelOpen;
    setPanelOpen(opening);
    if (opening && unreadCount > 0) markAllRead();
  };

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center px-4 lg:px-6 gap-4">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-gray-900 truncate">
          {current.title}
        </h1>
        {current.subtitle && (
          <p className="text-xs text-gray-400 hidden sm:block">
            {current.subtitle}
          </p>
        )}
      </div>

      {/* Notification bell */}
      <div className="relative" ref={wrapperRef}>
        <button
          onClick={handleBellClick}
          className="relative p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
          title="Notifications"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {panelOpen && (
          <NotifPanel
            notifications={notifications}
            onClose={() => setPanelOpen(false)}
          />
        )}
      </div>
    </header>
  );
};

export default TopBar;
