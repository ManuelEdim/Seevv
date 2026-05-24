import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout";
import ErrorBoundary from "@/components/ErrorBoundary";
import useAuth from "@/hooks/useAuth";
import useSessionTimeout from "@/hooks/useSessionTimeout";
import SessionTimeoutWarning from "@/components/SessionTimeoutWarning";
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
import Unauthorised from "@/pages/Unauthorised";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfUse from "@/pages/TermsOfUse";
import Admin from "@/pages/Admin";
import ApplicationTracker from "@/pages/ApplicationTracker";
import JobBoard from "@/pages/JobBoard";
import CompanyIntel from "@/pages/CompanyIntel";
import VoiceMirroring from "@/pages/VoiceMirroring";
import ApiAccess from "@/pages/ApiAccess";
import CustomBranding from "@/pages/CustomBranding";
import Verification from "@/pages/Verification";
import RejectionIntel from "@/pages/RejectionIntel";
import NegotiationCoach from "@/pages/NegotiationCoach";
import RecruiterOutreach from "@/pages/RecruiterOutreach";
import ApplyAssist from "@/pages/ApplyAssist";

const App = () => {
  const { isLoading } = useAuth();
  const { showWarning, secondsLeft, extendSession, doSignOut } = useSessionTimeout();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <div className="relative">
          <img
            src="/favicon.png"
            alt="Seevv"
            className="w-14 h-14 object-contain animate-pulse"
            style={{ animation: "seevv-breathe 1.6s ease-in-out infinite" }}
          />
          <div
            className="absolute inset-0 rounded-full"
            style={{ animation: "seevv-ring 1.6s ease-in-out infinite", boxShadow: "0 0 0 0 rgba(3,56,118,0.4)" }}
          />
        </div>
        <style>{`
          @keyframes seevv-breathe {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(0.88); }
          }
          @keyframes seevv-ring {
            0% { box-shadow: 0 0 0 0 rgba(3,56,118,0.35); }
            70% { box-shadow: 0 0 0 18px rgba(3,56,118,0); }
            100% { box-shadow: 0 0 0 0 rgba(3,56,118,0); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <ErrorBoundary>
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

        {/* Admin dashboard — standalone, no AppLayout, admin-gated on the page */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tracker"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ApplicationTracker />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs"
          element={
            <ProtectedRoute>
              <AppLayout>
                <JobBoard />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/company-intel"
          element={
            <ProtectedRoute>
              <AppLayout>
                <CompanyIntel />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/voice-mirror"
          element={
            <ProtectedRoute>
              <AppLayout>
                <VoiceMirroring />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/api-access"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ApiAccess />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/branding"
          element={
            <ProtectedRoute>
              <AppLayout>
                <CustomBranding />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/verification"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Verification />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route path="/rejection-intel" element={<ProtectedRoute><AppLayout><RejectionIntel /></AppLayout></ProtectedRoute>} />
        <Route path="/negotiation-coach" element={<ProtectedRoute><AppLayout><NegotiationCoach /></AppLayout></ProtectedRoute>} />
        <Route path="/recruiter-outreach" element={<ProtectedRoute><AppLayout><RecruiterOutreach /></AppLayout></ProtectedRoute>} />
        <Route path="/apply-assist" element={<ProtectedRoute><AppLayout><ApplyAssist /></AppLayout></ProtectedRoute>} />

        {/* 403 / 401 */}
        <Route path="/unauthorized" element={<Unauthorised />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfUse />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {showWarning && (
        <SessionTimeoutWarning
          secondsLeft={secondsLeft}
          onExtend={extendSession}
          onSignOut={doSignOut}
        />
      )}
    </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
