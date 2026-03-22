import { analyzeJobDescription } from "../lib/ai.js";
import { supabase } from "../lib/supabase.js";

export const decodeJobDescription = async (req, res) => {
  const { jobDescription, jobTargetId } = req.body;
  const userId = req.user.id;

  if (!jobDescription || jobDescription.trim().length < 50) {
    return res.status(400).json({
      error: "Job description must be at least 50 characters.",
    });
  }

  try {
    // Run AI analysis
    const analysis = await analyzeJobDescription(jobDescription);

    // Save to database if job target ID provided
    if (jobTargetId) {
      // Check if a decoder result already exists
      const { data: existing } = await supabase
        .from("decoder_results")
        .select("id")
        .eq("job_target_id", jobTargetId)
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        // Update existing
        await supabase
          .from("decoder_results")
          .update({
            hidden_need: analysis.hidden_need,
            hidden_need_confidence: analysis.hidden_need_confidence,
            culture_tone: analysis.culture_tone,
            urgency_level: analysis.urgency_level,
            ats_keywords: analysis.ats_keywords,
            requirements: analysis.requirements,
            signals: analysis.signals,
            positioning_advice: analysis.positioning_advice,
            raw_analysis: analysis,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        // Create new
        await supabase.from("decoder_results").insert({
          job_target_id: jobTargetId,
          user_id: userId,
          hidden_need: analysis.hidden_need,
          hidden_need_confidence: analysis.hidden_need_confidence,
          culture_tone: analysis.culture_tone,
          urgency_level: analysis.urgency_level,
          ats_keywords: analysis.ats_keywords,
          requirements: analysis.requirements,
          signals: analysis.signals,
          positioning_advice: analysis.positioning_advice,
          raw_analysis: analysis,
        });
      }

      // Update match score on job target
      await supabase
        .from("job_targets")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", jobTargetId)
        .eq("user_id", userId);
    }

    res.json({ success: true, analysis });
  } catch (error) {
    console.error("Decoder error:", error);
    res.status(500).json({
      error: "Failed to analyse job description. Please try again.",
      details: error.message,
    });
  }
};
