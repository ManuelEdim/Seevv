import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import useAuth from "@/hooks/useAuth";
import useToast from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import Decoder from "@/pages/Decoder";
import CVManager from "@/pages/CVManager";
import CVEditor from "@/pages/CVEditor";
import CoverLetter from "@/pages/CoverLetter";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/NotFound";

const App = () => {
  const { isLoading } = useAuth();
  const { toasts, removeToast } = useToast();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/decoder"
          element={
            <ProtectedRoute>
              <Decoder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cv"
          element={
            <ProtectedRoute>
              <CVManager />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cv/:versionId"
          element={
            <ProtectedRoute>
              <CVEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cover-letter"
          element={
            <ProtectedRoute>
              <CoverLetter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Global toast notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </BrowserRouter>
  );
};

export default App;
