import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store";

const useDashboard = () => {
  const user = useAuthStore((state) => state.user);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState({
    totalApplications: 0,
    avgMatchScore: 0,
    interviews: 0,
    cvVersions: 0,
  });
  const [jobTargets, setJobTargets] = useState([]);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data: jobs, error: jobsError } = await supabase
        .from("job_targets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (jobsError) throw jobsError;

      const { count: cvCount, error: cvError } = await supabase
        .from("cv_versions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (cvError) throw cvError;

      const applied =
        jobs?.filter((j) =>
          ["applied", "interview", "offer"].includes(j.status),
        ).length || 0;

      const interviews =
        jobs?.filter((j) => ["interview", "offer"].includes(j.status)).length ||
        0;

      const scoresWithValues = jobs?.filter((j) => j.match_score > 0) || [];
      const avgScore =
        scoresWithValues.length > 0
          ? Math.round(
              scoresWithValues.reduce((sum, j) => sum + j.match_score, 0) /
                scoresWithValues.length,
            )
          : 0;

      setJobTargets(jobs || []);
      setMetrics({
        totalApplications: applied,
        avgMatchScore: avgScore,
        interviews,
        cvVersions: cvCount || 0,
      });
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Optimistically add a job to the list immediately
  // without waiting for a database round trip
  const addJobOptimistically = useCallback(
    (jobData) => {
      const optimisticJob = {
        id: `temp-${Date.now()}`, // temporary ID until DB confirms
        user_id: user?.id,
        status: "saved",
        match_score: 0,
        created_at: new Date().toISOString(),
        ...jobData,
      };

      setJobTargets((prev) => [optimisticJob, ...prev]);
    },
    [user],
  );

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    isLoading,
    error,
    metrics,
    jobTargets,
    refetch: fetchDashboardData,
    addJobOptimistically,
  };
};

export default useDashboard;
