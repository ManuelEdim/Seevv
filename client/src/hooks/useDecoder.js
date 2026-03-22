import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { decoderService } from "@/lib/decoderService";
import { useAuthStore } from "@/store";

const useDecoder = () => {
  const user = useAuthStore((state) => state.user);
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get("jobId");

  const [job, setJob] = useState(null);
  const [decoderResult, setDecoderResult] = useState(null);
  const [isLoadingJob, setIsLoadingJob] = useState(false);
  const [isDecoding, setIsDecoding] = useState(false);
  const [activeTab, setActiveTab] = useState("hidden-need");
  const [error, setError] = useState(null);

  const fetchJob = useCallback(async () => {
    if (!jobId || !user) return;
    setIsLoadingJob(true);
    try {
      const { data, error } = await supabase
        .from("job_targets")
        .select("*, decoder_results(*)")
        .eq("id", jobId)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setJob(data);

      // Load existing decoder result if available
      if (data.decoder_results?.length > 0) {
        setDecoderResult(data.decoder_results[0]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoadingJob(false);
    }
  }, [jobId, user]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const runDecoder = useCallback(async (jobDescription, jobTargetId) => {
    setIsDecoding(true);
    setError(null);

    try {
      // Real AI call to backend
      const response = await decoderService.analyze(
        jobDescription,
        jobTargetId,
      );

      setDecoderResult(response.analysis);
    } catch (err) {
      setError(
        err.message || "Failed to decode job description. Please try again.",
      );
    } finally {
      setIsDecoding(false);
    }
  }, []);

  return {
    job,
    decoderResult,
    isLoadingJob,
    isDecoding,
    activeTab,
    setActiveTab,
    error,
    runDecoder,
    refetch: fetchJob,
  };
};

export default useDecoder;
