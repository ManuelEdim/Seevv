import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout";
import useAuth from "@/hooks/useAuth";
import AuthCallback from "@/pages/AuthCallback";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import Decoder from "@/pages/Decoder";
import CVManager from "@/pages/CVManager";
import CVEditor from "@/pages/CVEditor";
import CoverLetter from "@/pages/CoverLetter";
import Profile from "@/pages/Profile";
import GapRoadmap from "@/pages/GapRoadmap";
import TransitionMode from "@/pages/TransitionMode";
import SpeedMode from "@/pages/SpeedMode";
import ProofOfWork from "@/pages/ProofOfWork";
import SkillsGraph from "@/pages/SkillsGraph";
import RecruiterPortal from "@/pages/RecruiterPortal";
import Pricing from "@/pages/Pricing";
import InterviewPrep from "@/pages/InterviewPrep";
import MockInterview from "@/pages/MockInterview";
import ApplicationAnalytics from "@/pages/ApplicationAnalytics";
import NotFound from "@/pages/NotFound";

const App = () => {
  const { isLoading } = useAuth();

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
        {/* Public routes — no layout */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Protected routes — wrapped in AppLayout */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/decoder"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Decoder />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/cv"
          element={
            <ProtectedRoute>
              <AppLayout>
                <CVManager />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/cv/:versionId"
          element={
            <ProtectedRoute>
              <AppLayout>
                <CVEditor />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/cover-letter"
          element={
            <ProtectedRoute>
              <AppLayout>
                <CoverLetter />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Profile />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/gap-roadmap"
          element={
            <ProtectedRoute>
              <AppLayout>
                <GapRoadmap />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/transition"
          element={
            <ProtectedRoute>
              <AppLayout>
                <TransitionMode />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/speed-mode"
          element={
            <ProtectedRoute>
              <AppLayout>
                <SpeedMode />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/skills"
          element={
            <ProtectedRoute>
              <AppLayout>
                <SkillsGraph />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        {/* Recruiter portal — standalone, no AppLayout, role-gated on the page */}
        <Route
          path="/recruiter/*"
          element={
            <ProtectedRoute>
              <RecruiterPortal />
            </ProtectedRoute>
          }
        />

        <Route
          path="/proof-of-work"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ProofOfWork />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/interview-prep"
          element={
            <ProtectedRoute>
              <AppLayout>
                <InterviewPrep />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/mock-interview"
          element={
            <ProtectedRoute>
              <AppLayout>
                <MockInterview />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ApplicationAnalytics />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Pricing — no AppLayout, standalone page */}
        <Route
          path="/pricing"
          element={
            <ProtectedRoute>
              <Pricing />
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
