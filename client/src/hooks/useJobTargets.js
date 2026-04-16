import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store";

const useJobTargets = () => {
  const user = useAuthStore((state) => state.user);
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;

    const fetch = async () => {
      setIsLoading(true);
      const { data, error: err } = await supabase
        .from("job_targets")
        .select("id, job_title, company_name, job_description, status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (err) setError(err.message);
      else setJobs(data || []);
      setIsLoading(false);
    };

    fetch();
  }, [user]);

  return { jobs, isLoading, error };
};

export default useJobTargets;
