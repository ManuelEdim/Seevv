import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store";
import { detectIsNigerian, getDetectedCountry } from "@/lib/location";

const useProfile = () => {
  const user = useAuthStore((state) => state.user);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      // Auto-detect country on first load if not set
      if (!data.country) {
        const detectedCountry = getDetectedCountry();
        if (detectedCountry) {
          const countryCode = detectedCountry === "Nigeria" ? "NG" : null;
          if (countryCode) {
            await supabase
              .from("profiles")
              .update({ country: countryCode })
              .eq("id", user.id);
            data.country = countryCode;
          }
        }
      }

      setProfile(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(
    async (updates) => {
      if (!user) return;
      setIsSaving(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id)
          .select()
          .single();

        if (error) throw error;
        setProfile(data);
        return data;
      } catch (err) {
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [user],
  );

  const updatePassword = useCallback(async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }, []);

  return {
    profile,
    user,
    isLoading,
    isSaving,
    error,
    updateProfile,
    updatePassword,
    refetch: fetchProfile,
  };
};

export default useProfile;
