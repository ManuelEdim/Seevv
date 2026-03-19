import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

const useAuthStore = create(
  devtools(
    persist(
      (set) => ({
        // State — real defaults, no fake data
        user: null,
        session: null,
        isAuthenticated: false,
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
      {
        name: "seevv-auth",
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      },
    ),
    { name: "AuthStore" },
  ),
);

export default useAuthStore;
