import { useLocation } from "react-router-dom";

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

const TopBar = () => {
  const location = useLocation();
  const current = pageTitles[location.pathname] || {
    title: "Seevv",
    subtitle: "",
  };

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center px-6 gap-4">
      <div className="flex-1">
        <h1 className="text-base font-semibold text-gray-900">
          {current.title}
        </h1>
        {current.subtitle && (
          <p className="text-xs text-gray-400">{current.subtitle}</p>
        )}
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-3">
        {/* Notification bell placeholder */}
        <button className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default TopBar;
