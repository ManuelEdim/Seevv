import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store";

const useCVEditor = () => {
  const { versionId } = useParams();
  const user = useAuthStore((state) => state.user);

  const [version, setVersion] = useState(null);
  const [job, setJob] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const userId = user?.id;

  const fetchVersion = useCallback(async () => {
    if (!versionId || !userId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("cv_versions")
        .select(
          `
          *,
          job_target:job_targets(
            id, job_title, company_name, job_description, status
          ),
          cv:cvs(id, file_name, raw_text)
        `,
        )
        .eq("id", versionId)
        .eq("user_id", userId)
        .single();

      if (error) throw error;

      setVersion(data);
      setJob(data.job_target);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [versionId, userId]);

  useEffect(() => {
    fetchVersion();
  }, [fetchVersion]);

  const updateSection = useCallback((sectionKey, newContent) => {
    setVersion((prev) => ({
      ...prev,
      tailored_content: {
        ...prev.tailored_content,
        [sectionKey]: newContent,
      },
    }));
    setHasUnsavedChanges(true);
  }, []);

  const saveVersion = useCallback(async () => {
    if (!version) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("cv_versions")
        .update({
          tailored_content: version.tailored_content,
          tone: version.tone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", version.id)
        .eq("user_id", userId);

      if (error) throw error;
      setHasUnsavedChanges(false);
    } finally {
      setIsSaving(false);
    }
  }, [version, userId]);

  const updateTone = useCallback((tone) => {
    setVersion((prev) => ({ ...prev, tone }));
    setHasUnsavedChanges(true);
  }, []);

  return {
    version,
    job,
    isLoading,
    isSaving,
    error,
    hasUnsavedChanges,
    updateSection,
    saveVersion,
    updateTone,
    refetch: fetchVersion,
  };
};

export default useCVEditor;
