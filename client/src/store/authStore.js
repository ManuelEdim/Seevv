import { create } from "zustand";
import { devtools } from "zustand/middleware";

const useAuthStore = create(
  devtools(
    (set) => ({
      // State
      user: {
        email: "test@seevv.com",
        user_metadata: {
          full_name: "Test User",
        },
      },
      session: null,
      isAuthenticated: true,
      isLoading: false,
      error: null,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setSession: (session) => set({ session }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      login: (user, session) =>
        set({
          user,
          session,
          isAuthenticated: true,
          error: null,
        }),

      logout: () =>
        set({
          user: null,
          session: null,
          isAuthenticated: false,
          error: null,
        }),
    }),
    { name: "AuthStore" },
  ),
);

export default useAuthStore;
