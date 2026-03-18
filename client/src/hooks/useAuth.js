import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store";

const useAuth = () => {
  const { login, logout, setLoading } = useAuthStore();

  useEffect(() => {
    // Check for existing session on app load
    const initAuth = async () => {
      setLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          login(session.user, session);
        }
      } catch (error) {
        console.error("Auth init error:", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes
    // This fires on: sign in, sign out, token refresh
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        login(session.user, session);
      } else if (event === "SIGNED_OUT") {
        logout();
      } else if (event === "TOKEN_REFRESHED" && session) {
        login(session.user, session);
      }
    });

    // Cleanup listener when component unmounts
    return () => subscription.unsubscribe();
  }, [login, logout, setLoading]);

  return useAuthStore();
};

export default useAuth;
