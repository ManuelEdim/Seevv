import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store";

const fetchProfile = async (userId) => {
  const { data } = await supabase
    .from("profiles")
    .select("role, plan, plan_expires_at, feature_overrides, full_name, email")
    .eq("id", userId)
    .single();
  return data || { role: "user", plan: "free", feature_overrides: {} };
};

const useAuth = () => {
  const { login, logout, setLoading } = useAuthStore();

  useEffect(() => {
    let cancelled = false;

    const initAuth = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;
        if (session) {
          const profile = await fetchProfile(session.user.id);
          if (cancelled) return;
          login(session.user, session, profile);
        }
      } catch (err) {
        if (err?.name !== "AbortError") {
          console.error("Auth init error:", err);
        }
      } finally {
        // Always clear loading — even if cancelled, the store must not stay stuck
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (cancelled) return;
        try {
          if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
            const profile = await fetchProfile(session.user.id);
            if (cancelled) return;
            login(session.user, session, profile);
          } else if (event === "SIGNED_OUT") {
            logout();
          } else if (event === "TOKEN_REFRESHED" && session) {
            const profile = await fetchProfile(session.user.id);
            if (cancelled) return;
            login(session.user, session, profile);
          }
        } catch (err) {
          if (err?.name !== "AbortError") {
            console.error("Auth state change error:", err);
          }
        }
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [login, logout, setLoading]);

  return useAuthStore();
};

export default useAuth;
