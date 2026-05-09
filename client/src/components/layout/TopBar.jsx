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

const TopBar = ({ onMenuClick }) => {
  const location = useLocation();
  const current = pageTitles[location.pathname] || {
    title: "Seevv",
    subtitle: "",
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

    </header>
  );
};

export default TopBar;
