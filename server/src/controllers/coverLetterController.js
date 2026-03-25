import { generateCoverLetter } from "../lib/ai.js";
import { supabase } from "../lib/supabase.js";

export const generateCoverLetterController = async (req, res) => {
  const { jobTargetId, tone = "formal" } = req.body;
  const userId = req.user.id;

  if (!jobTargetId) {
    return res.status(400).json({ error: "Job target ID is required." });
  }

  try {
    // Get job target
    const { data: job, error: jobError } = await supabase
      .from("job_targets")
      .select("*")
      .eq("id", jobTargetId)
      .eq("user_id", userId)
      .single();

    if (jobError || !job) {
      return res.status(404).json({ error: "Job target not found." });
    }

    // Get user's master CV raw text
    const { data: cv } = await supabase
      .from("cvs")
      .select("raw_text")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Get user's voice sample
    const { data: profile } = await supabase
      .from("profiles")
      .select("voice_sample, full_name")
      .eq("id", userId)
      .single();

    const cvText = cv?.raw_text || "";
    const voiceSample = profile?.voice_sample || null;

    // Generate cover letter with AI
    const content = await generateCoverLetter(
      job.job_title,
      job.company_name,
      job.job_description || "",
      cvText,
      tone,
      voiceSample,
    );

    // Count words
    const wordCount = content.split(/\s+/).filter(Boolean).length;

    res.json({
      success: true,
      content,
      word_count: wordCount,
      job_title: job.job_title,
      company_name: job.company_name,
    });
  } catch (error) {
    console.error("Cover letter generation error:", error);
    res.status(500).json({
      error: "Failed to generate cover letter.",
      details: error.message,
    });
  }
};
