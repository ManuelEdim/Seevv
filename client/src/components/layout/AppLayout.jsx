import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import OnboardingGuide from "@/components/OnboardingGuide";
import SearchModal from "@/components/SearchModal";
import { useAuthStore } from "@/store";
import { hasFeature } from "@/lib/features";

// ─── Mobile bottom nav (5 key items) ──────────────────────
const BOTTOM_NAV = [
  {
    label: "Home",
    path: "/dashboard",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: "My CVs",
    path: "/cv",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
  },
  {
    label: "Jobs",
    path: "/jobs",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      </svg>
    ),
  },
  {
    label: "Decoder",
    path: "/decoder",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
    ),
  },
  {
    label: "Profile",
    path: "/profile",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

const MobileBottomNav = () => {
  const profile   = useAuthStore((s) => s.profile);
  const plan      = profile?.plan || "free";
  const role      = profile?.role || "user";
  const overrides = profile?.feature_overrides || {};

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex items-stretch"
      style={{
        background: "var(--sidebar-bg)",
        borderTop: "1px solid var(--sidebar-border)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {BOTTOM_NAV.map((item) => {
        const isLocked = item.feature && role !== "admin" && !hasFeature(plan, item.feature, overrides);
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
                isActive
                  ? "text-teal-400"
                  : isLocked
                  ? "opacity-30 pointer-events-none"
                  : ""
              }`
            }
            style={({ isActive }) => ({ color: isActive ? "#1d9e75" : "var(--sidebar-nav-text)" })}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

const AppLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen]   = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "var(--page-bg)" }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-[2px]"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main area — offset by sidebar on desktop */}
      <div className="lg:ml-55 flex flex-col min-h-screen">
        <TopBar onMenuClick={() => setSidebarOpen((prev) => !prev)} onSearchClick={() => setSearchOpen(true)} />
        {/* Bottom padding on mobile so content isn't hidden behind bottom nav */}
        <main className="flex-1 p-4 sm:p-5 lg:p-6 pb-20 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileBottomNav />

      {/* Onboarding guide */}
      <OnboardingGuide />

      {/* Global search modal */}
      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </div>
  );
};

export default AppLayout;
