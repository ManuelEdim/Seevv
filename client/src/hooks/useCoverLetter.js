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
  const [allCoverLetters, setAllCoverLetters] = useState([]);
  const [content, setContent] = useState("");
  const [tone, setTone] = useState("formal");
  const [wordCount, setWordCount] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAll, setIsLoadingAll] = useState(true);
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

  // Fetch ALL cover letters for this user (for the list view)
  const fetchAllCoverLetters = useCallback(async () => {
    if (!user) {
      setIsLoadingAll(false);
      return;
    }
    setIsLoadingAll(true);
    try {
      const { data, error } = await supabase
        .from("cover_letters")
        .select(
          `
          *,
          job_target:job_targets(id, job_title, company_name)
        `,
        )
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setAllCoverLetters(data || []);
    } catch (err) {
      console.error("Failed to fetch cover letters:", err);
    } finally {
      setIsLoadingAll(false);
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

  // Load a saved cover letter into the editor
  const setActiveLetter = useCallback((letter) => {
    setCoverLetter(letter);
    setContent(letter.content);
    setTone(letter.tone);
    setWordCount(letter.content.split(/\s+/).filter(Boolean).length);
    setHasUnsavedChanges(false);
    if (letter.job_target) setJob(letter.job_target);
  }, []);

  // Clear the editor for composing a new letter
  const clearEditor = useCallback(() => {
    setCoverLetter(null);
    setContent("");
    setTone("formal");
    setWordCount(0);
    setHasUnsavedChanges(false);
    setJob(null);
    setError(null);
  }, []);

  // Delete a cover letter by id
  const deleteCoverLetter = useCallback(
    async (id) => {
      const { error } = await supabase
        .from("cover_letters")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      setAllCoverLetters((prev) => prev.filter((cl) => cl.id !== id));
    },
    [user],
  );

  useEffect(() => {
    fetchJobs();
    fetchAllCoverLetters();
  }, [fetchJobs, fetchAllCoverLetters]);

  useEffect(() => {
    if (jobId) fetchCoverLetter(jobId);
  }, [jobId, fetchCoverLetter]);

  const handleContentChange = useCallback((newContent) => {
    setContent(newContent);
    setWordCount(newContent.split(/\s+/).filter(Boolean).length);
    setHasUnsavedChanges(true);
  }, []);

  const generateCoverLetter = useCallback(
    async (targetJobId, selectedTone, onSuccess) => {
      if (!targetJobId) return;
      setIsGenerating(true);
      setError(null);

      try {
        const response = await api.post("/cover-letter/generate", {
          jobTargetId: targetJobId,
          tone: selectedTone || tone,
        });

        const generatedContent = response.content;
        if (!generatedContent) throw new Error("No content returned. Please try again.");
        setContent(generatedContent);
        setWordCount(
          response.word_count ||
            generatedContent.split(/\s+/).filter(Boolean).length,
        );
        setHasUnsavedChanges(true);

        if (onSuccess) onSuccess();
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

          // Update in-list state
          setAllCoverLetters((prev) =>
            prev.map((cl) =>
              cl.id === coverLetter.id
                ? { ...cl, content, tone, word_count: wordCount, updated_at: new Date().toISOString() }
                : cl,
            ),
          );
        } else {
          const { data, error } = await supabase
            .from("cover_letters")
            .insert({
              user_id: user.id,
              job_target_id: targetJobId,
              content,
              tone,
              word_count: wordCount,
            })
            .select(
              `
              *,
              job_target:job_targets(id, job_title, company_name)
            `,
            )
            .single();

          if (error) throw error;
          setCoverLetter(data);
          setAllCoverLetters((prev) => [data, ...prev]);
        }

        setHasUnsavedChanges(false);
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
    allCoverLetters,
    content,
    tone,
    wordCount,
    isGenerating,
    isSaving,
    isLoading,
    isLoadingAll,
    hasUnsavedChanges,
    error,
    setTone,
    handleContentChange,
    generateCoverLetter,
    saveCoverLetter,
    fetchCoverLetter,
    fetchAllCoverLetters,
    deleteCoverLetter,
    setActiveLetter,
    clearEditor,
  };
};

export default useCoverLetter;
