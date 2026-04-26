import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

const useAuthStore = create(
  devtools(
    persist(
      (set) => ({
        user: null,
        profile: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        setUser: (user) => set({ user, isAuthenticated: !!user }),
        setProfile: (profile) => set({ profile }),
        setSession: (session) => set({ session }),
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),

        login: (user, session, profile = null) =>
          set({
            user,
            session,
            profile,
            isAuthenticated: true,
            error: null,
          }),

        logout: () =>
          set({
            user: null,
            session: null,
            profile: null,
            isAuthenticated: false,
            error: null,
          }),
      }),
      {
        name: "seevv-auth",
        partialize: (state) => ({
          user: state.user,
          profile: state.profile,
          isAuthenticated: state.isAuthenticated,
        }),
      },
    ),
    { name: "AuthStore" },
  ),
);

export default useAuthStore;
