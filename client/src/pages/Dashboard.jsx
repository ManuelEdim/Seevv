import { useAuthStore, useCVStore, useJobStore } from "@/store";

const Dashboard = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const versions = useCVStore((state) => state.versions);
  const jobs = useJobStore((state) => state.jobs);

  return (
    <div className="p-8">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">Dashboard</h2>

      <div className="flex gap-4">
        <div className="p-4 rounded-lg border border-gray-100">
          <p className="text-xs text-gray-400 mb-1">Auth status</p>
          <p className="font-medium text-brand-600">
            {isAuthenticated ? "Authenticated" : "Not authenticated"}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-100">
          <p className="text-xs text-gray-400 mb-1">CV versions</p>
          <p className="font-medium text-brand-600">{versions.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-100">
          <p className="text-xs text-gray-400 mb-1">Job targets</p>
          <p className="font-medium text-brand-600">{jobs.length}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
