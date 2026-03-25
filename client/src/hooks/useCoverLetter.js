import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store";
import api from "@/lib/api";

const useCoverLetter = () => {
  const user = useAuthStore((state) => state.user);
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get("jobId");

  const [job, setJob] = useState(null);
  const [coverLetter, setCoverLetter] = useState(null);
  const [content, setContent] = useState("");
  const [tone, setTone] = useState("formal");
  const [wordCount, setWordCount] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [error, setError] = useState(null);
  const [jobs, setJobs] = useState([]);

  // Fetch all job targets for the selector
  const fetchJobs = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("job_targets")
        .select("id, job_title, company_name")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    }
  }, [user]);

  // Fetch existing cover letter for the selected job
  const fetchCoverLetter = useCallback(
    async (targetJobId) => {
      if (!targetJobId || !user) return;
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("cover_letters")
          .select(
            `
          *,
          job_target:job_targets(id, job_title, company_name, job_description)
        `,
          )
          .eq("job_target_id", targetJobId)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setCoverLetter(data);
          setContent(data.content);
          setTone(data.tone);
          setWordCount(data.content.split(/\s+/).filter(Boolean).length);
        }

        // Also fetch the job details
        const { data: jobData } = await supabase
          .from("job_targets")
          .select("*")
          .eq("id", targetJobId)
          .eq("user_id", user.id)
          .single();

        if (jobData) setJob(jobData);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    [user],
  );

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    if (jobId) fetchCoverLetter(jobId);
  }, [jobId, fetchCoverLetter]);

  const handleContentChange = useCallback((newContent) => {
    setContent(newContent);
    setWordCount(newContent.split(/\s+/).filter(Boolean).length);
    setHasUnsavedChanges(true);
  }, []);

  const generateCoverLetter = useCallback(
    async (targetJobId, selectedTone) => {
      if (!targetJobId) return;
      setIsGenerating(true);
      setError(null);

      try {
        // Real AI call to backend
        const response = await api.post("/cover-letter/generate", {
          jobTargetId: targetJobId,
          tone: selectedTone || tone,
        });

        const generatedContent = response.content;
        setContent(generatedContent);
        setWordCount(
          response.word_count ||
            generatedContent.split(/\s+/).filter(Boolean).length,
        );
        setHasUnsavedChanges(true);
      } catch (err) {
        setError(
          err.response?.data?.error ||
            err.message ||
            "Failed to generate cover letter. Please try again.",
        );
      } finally {
        setIsGenerating(false);
      }
    },
    [tone],
  );

  const saveCoverLetter = useCallback(
    async (targetJobId) => {
      if (!content || !targetJobId) return;
      setIsSaving(true);

      try {
        if (coverLetter) {
          // Update existing
          const { error } = await supabase
            .from("cover_letters")
            .update({
              content,
              tone,
              word_count: wordCount,
              updated_at: new Date().toISOString(),
            })
            .eq("id", coverLetter.id)
            .eq("user_id", user.id);

          if (error) throw error;
        } else {
          // Create new
          const { data, error } = await supabase
            .from("cover_letters")
            .insert({
              user_id: user.id,
              job_target_id: targetJobId,
              content,
              tone,
              word_count: wordCount,
            })
            .select()
            .single();

          if (error) throw error;
          setCoverLetter(data);
        }

        setHasUnsavedChanges(false);
      } catch (err) {
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [content, tone, wordCount, coverLetter, user],
  );

  return {
    job,
    jobs,
    jobId,
    coverLetter,
    content,
    tone,
    wordCount,
    isGenerating,
    isSaving,
    isLoading,
    hasUnsavedChanges,
    error,
    setTone,
    handleContentChange,
    generateCoverLetter,
    saveCoverLetter,
    fetchCoverLetter,
  };
};

export default useCoverLetter;
