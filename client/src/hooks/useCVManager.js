import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store";

const useCVManager = () => {
  const user = useAuthStore((state) => state.user);
  const [masterCV, setMasterCV] = useState(null);
  const [cvVersions, setCvVersions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCVData = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      // Fetch master CV
      const { data: cv, error: cvError } = await supabase
        .from("cvs")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cvError) throw cvError;
      setMasterCV(cv);

      // Fetch CV versions with job target info
      const { data: versions, error: versionsError } = await supabase
        .from("cv_versions")
        .select(
          `
          *,
          job_target:job_targets(job_title, company_name, status)
        `,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (versionsError) throw versionsError;
      setCvVersions(versions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCVData();
  }, [fetchCVData]);

  const deleteVersion = useCallback(
    async (versionId) => {
      const { error } = await supabase
        .from("cv_versions")
        .delete()
        .eq("id", versionId)
        .eq("user_id", user.id);

      if (error) throw error;

      // Optimistically remove from list
      setCvVersions((prev) => prev.filter((v) => v.id !== versionId));
    },
    [user],
  );

  const deleteMasterCV = useCallback(async () => {
    if (!masterCV) return;
    const { error } = await supabase
      .from("cvs")
      .delete()
      .eq("id", masterCV.id)
      .eq("user_id", user.id);

    if (error) throw error;
    setMasterCV(null);
  }, [masterCV, user]);

  return {
    masterCV,
    cvVersions,
    isLoading,
    error,
    refetch: fetchCVData,
    deleteVersion,
    deleteMasterCV,
  };
};

export default useCVManager;
