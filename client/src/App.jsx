import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";

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

function App() {
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
    </BrowserRouter>
  );
}

export default App;
