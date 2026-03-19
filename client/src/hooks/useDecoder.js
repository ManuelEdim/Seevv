import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
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

  const runDecoder = useCallback(
    async (jobDescription, jobTargetId) => {
      setIsDecoding(true);
      setError(null);
      try {
        // Placeholder — real AI call in Phase 4
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const mockResult = {
          hidden_need:
            "This company needs a problem-solver, not just a task executor. The repeated emphasis on 'ownership' and 'fast-paced' signals they're understaffed and need someone who thrives without hand-holding.",
          hidden_need_confidence: "high",
          culture_tone: "Startup / high-ownership",
          urgency_level: "high",
          ats_keywords: [
            { keyword: "product design", weight: 95 },
            { keyword: "figma", weight: 90 },
            { keyword: "user research", weight: 85 },
            { keyword: "cross-functional", weight: 80 },
            { keyword: "design systems", weight: 75 },
          ],
          requirements: [
            { text: "5+ years product design experience", status: "met" },
            { text: "Expert Figma skills", status: "met" },
            { text: "Experience in fintech or payments", status: "partial" },
            { text: "Design systems ownership", status: "gap" },
            { text: "Cross-functional collaboration", status: "met" },
          ],
          signals: [
            {
              phrase: "wearing many hats",
              interpretation: "Understaffed — you'll cover multiple roles",
              type: "urgency",
            },
            {
              phrase: "fast-paced environment",
              interpretation: "Expect frequent pivots and tight deadlines",
              type: "urgency",
            },
            {
              phrase: "ownership of legacy systems",
              interpretation: "Technical debt exists — they need a fixer",
              type: "pain",
            },
            {
              phrase: "limited oversight",
              interpretation: "Thin management layer — high autonomy expected",
              type: "structure",
            },
          ],
          positioning_advice: [
            "Lead with rescue and stabilisation experience, not greenfield projects",
            "Quantify your independence — 'sole designer responsible for X'",
            "Downplay management ambitions — they want an IC who owns problems",
          ],
        };

        setDecoderResult(mockResult);

        // Save to database if we have a job target
        if (jobTargetId) {
          await supabase.from("decoder_results").upsert({
            job_target_id: jobTargetId,
            user_id: user.id,
            ...mockResult,
          });
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsDecoding(false);
      }
    },
    [user],
  );

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
