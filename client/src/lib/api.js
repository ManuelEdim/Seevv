import axios from "axios";
import { supabase } from "./supabase";

// Create axios instance with base config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 120000, // 2 minutes — CV rewriting makes multiple AI calls
});

// ─── Request interceptor ───────────────────────────────
// Runs before every request — attaches the user's auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    } catch (error) {
      console.error("Failed to get session for API request:", error);
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response interceptor ──────────────────────────────
// Runs after every response — handles errors consistently
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't already retried — token may have expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the session
        const {
          data: { session },
        } = await supabase.auth.refreshSession();

        if (session?.access_token) {
          originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
          return api(originalRequest);
        }
      } catch {
        // Refresh failed — sign out the user
        await supabase.auth.signOut();
        window.location.href = "/login";
      }
    }

    // Extract the error message from the response
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      "Something went wrong";

    return Promise.reject(new Error(message));
  },
);

export default api;
