import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store";

const useAuth = () => {
  const { login, logout, setLoading } = useAuthStore();

  useEffect(() => {
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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth event:", event, session?.user?.email);

      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
        login(session.user, session);
      } else if (event === "SIGNED_OUT") {
        logout();
      } else if (event === "TOKEN_REFRESHED" && session) {
        login(session.user, session);
      }
    });

    return () => subscription.unsubscribe();
  }, [login, logout, setLoading]);

  return useAuthStore();
};

export default useAuth;
