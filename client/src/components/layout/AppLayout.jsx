import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

const AppLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar — fixed on the left */}
      <Sidebar />

      {/* Main content — offset by sidebar width */}
      <div className="ml-56 flex flex-col min-h-screen">
        {/* Top bar */}
        <TopBar />

        {/* Page content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
