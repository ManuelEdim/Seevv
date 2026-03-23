import { supabase, supabaseAdmin } from "../lib/supabase.js";
import { parseCV, cleanText } from "../lib/cvParser.js";
import {
  rewriteCVSection,
  calculateMatchScore,
  detectBlindSpots,
} from "../lib/ai.js";

// Parse an uploaded CV and save the raw text to the database
export const parseUploadedCV = async (req, res) => {
  const { cvId } = req.body;
  const userId = req.user.id;

  if (!cvId) {
    return res.status(400).json({ error: "CV ID is required." });
  }

  try {
    // Fetch CV record from database
    const { data: cv, error: cvError } = await supabase
      .from("cvs")
      .select("*")
      .eq("id", cvId)
      .eq("user_id", userId)
      .single();

    if (cvError || !cv) {
      return res.status(404).json({ error: "CV not found." });
    }

    // Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from("cvs")
      .download(cv.file_url);

    if (downloadError) throw downloadError;

    // Convert to buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse the CV
    const rawText = await parseCV(buffer, cv.file_type);
    const cleanedText = cleanText(rawText);

    if (!cleanedText || cleanedText.length < 100) {
      return res.status(400).json({
        error:
          "Could not extract text from CV. Please try a different file format.",
      });
    }

    // Save parsed text to database
    const { error: updateError } = await supabase
      .from("cvs")
      .update({
        raw_text: cleanedText,
        parsed_at: new Date().toISOString(),
      })
      .eq("id", cvId)
      .eq("user_id", userId);

    if (updateError) throw updateError;

    res.json({
      success: true,
      message: "CV parsed successfully.",
      wordCount: cleanedText.split(/\s+/).filter(Boolean).length,
      preview: cleanedText.slice(0, 300),
    });
  } catch (error) {
    console.error("CV parse error:", error);
    res.status(500).json({
      error: "Failed to parse CV.",
      details: error.message,
    });
  }
};

// Rewrite a CV version using AI
export const rewriteCV = async (req, res) => {
  const { cvId, jobTargetId, tone = "balanced" } = req.body;
  const userId = req.user.id;

  if (!cvId || !jobTargetId) {
    return res
      .status(400)
      .json({ error: "CV ID and job target ID are required." });
  }

  try {
    // Fetch CV with raw text
    const { data: cv, error: cvError } = await supabase
      .from("cvs")
      .select("*")
      .eq("id", cvId)
      .eq("user_id", userId)
      .single();

    if (cvError || !cv) {
      return res.status(404).json({ error: "CV not found." });
    }

    if (!cv.raw_text) {
      return res.status(400).json({
        error: "CV has not been parsed yet. Please re-upload your CV.",
      });
    }

    // Fetch job target
    const { data: job, error: jobError } = await supabase
      .from("job_targets")
      .select("*")
      .eq("id", jobTargetId)
      .eq("user_id", userId)
      .single();

    if (jobError || !job) {
      return res.status(404).json({ error: "Job target not found." });
    }

    // Fetch user profile for voice sample
    const { data: profile } = await supabase
      .from("profiles")
      .select("voice_sample, full_name")
      .eq("id", userId)
      .single();

    const voiceSample = profile?.voice_sample || null;
    const jobDescription = job.job_description;

    // Run AI rewrites in parallel for speed
    const [
      summaryRewrite,
      experienceRewrite,
      skillsRewrite,
      matchScore,
      blindSpots,
    ] = await Promise.all([
      rewriteCVSection(
        "professional summary",
        cv.raw_text.slice(0, 500),
        jobDescription,
        voiceSample,
      ),
      rewriteCVSection(
        "work experience",
        cv.raw_text.slice(500, 2000),
        jobDescription,
        voiceSample,
      ),
      rewriteCVSection(
        "skills",
        cv.raw_text.slice(2000, 3000),
        jobDescription,
        voiceSample,
      ),
      calculateMatchScore(cv.raw_text, jobDescription),
      detectBlindSpots(cv.raw_text, jobDescription),
    ]);

    const tailoredContent = {
      summary: {
        original: cv.raw_text.slice(0, 500),
        tailored: summaryRewrite,
        accepted: false,
      },
      experience: {
        original: cv.raw_text.slice(500, 2000),
        tailored: experienceRewrite,
        accepted: false,
      },
      skills: {
        original: cv.raw_text.slice(2000, 3000),
        tailored: skillsRewrite,
        accepted: false,
      },
      blind_spots: blindSpots,
      match_score: matchScore,
    };

    // Check if CV version already exists for this job
    const { data: existingVersion } = await supabase
      .from("cv_versions")
      .select("id")
      .eq("cv_id", cvId)
      .eq("job_target_id", jobTargetId)
      .eq("user_id", userId)
      .maybeSingle();

    let versionId;

    if (existingVersion) {
      // Update existing version
      await supabase
        .from("cv_versions")
        .update({
          tailored_content: tailoredContent,
          tone,
          match_score: matchScore.overall_score,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingVersion.id);

      versionId = existingVersion.id;
    } else {
      // Create new version
      const { data: newVersion, error: versionError } = await supabase
        .from("cv_versions")
        .insert({
          user_id: userId,
          cv_id: cvId,
          job_target_id: jobTargetId,
          version_name: `${job.job_title} at ${job.company_name}`,
          tailored_content: tailoredContent,
          tone,
          match_score: matchScore.overall_score,
          is_active: true,
        })
        .select()
        .single();

      if (versionError) throw versionError;
      versionId = newVersion.id;
    }

    res.json({
      success: true,
      versionId,
      matchScore: matchScore.overall_score,
      tailoredContent,
    });
  } catch (error) {
    console.error("CV rewrite error:", error);
    res.status(500).json({
      error: "Failed to rewrite CV.",
      details: error.message,
    });
  }
};

// Get match score for a CV against a job
export const getMatchScore = async (req, res) => {
  const { cvId, jobTargetId } = req.body;
  const userId = req.user.id;

  try {
    const { data: cv } = await supabase
      .from("cvs")
      .select("raw_text")
      .eq("id", cvId)
      .eq("user_id", userId)
      .single();

    const { data: job } = await supabase
      .from("job_targets")
      .select("job_description")
      .eq("id", jobTargetId)
      .eq("user_id", userId)
      .single();

    if (!cv?.raw_text || !job?.job_description) {
      return res.status(400).json({
        error: "CV text or job description missing.",
      });
    }

    const score = await calculateMatchScore(cv.raw_text, job.job_description);

    res.json({ success: true, score });
  } catch (error) {
    res.status(500).json({
      error: "Failed to calculate match score.",
      details: error.message,
    });
  }
};
