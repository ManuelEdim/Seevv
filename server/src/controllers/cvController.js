import { parseCV, extractCVSections, cleanText } from "../lib/cvParser.js";
import {
  rewriteSingleBullet,
  rewriteCVSection,
  calculateMatchScore,
  detectBlindSpots,
  scoreSectionMatch,
} from "../lib/ai.js";
import { supabase } from "../lib/supabase.js";

// Parse an uploaded CV and save the raw text
export const parseCVController = async (req, res) => {
  const { cvId } = req.body;
  const userId = req.user.id;

  try {
    const { data: cv, error } = await supabase
      .from("cvs")
      .select("*")
      .eq("id", cvId)
      .eq("user_id", userId)
      .single();

    if (error || !cv) {
      return res.status(404).json({ error: "CV not found." });
    }

    const rawText = await parseCV(cv.file_url, cv.file_type);
    const cleanedText = cleanText(rawText);
    const sections = extractCVSections(cleanedText);

    await supabase
      .from("cvs")
      .update({
        raw_text: cleanedText,
        parsed_sections: sections,
        updated_at: new Date().toISOString(),
      })
      .eq("id", cvId)
      .eq("user_id", userId);

    res.json({ success: true, raw_text: cleanedText, sections });
  } catch (error) {
    console.error("CV parse error:", error);
    res
      .status(500)
      .json({ error: "Failed to parse CV.", details: error.message });
  }
};

// Smart selective CV rewriter
export const rewriteCVController = async (req, res) => {
  const { cvId, jobTargetId, tone = "balanced" } = req.body;
  const userId = req.user.id;

  try {
    // Get CV
    const { data: cv, error: cvError } = await supabase
      .from("cvs")
      .select("*")
      .eq("id", cvId)
      .eq("user_id", userId)
      .single();

    if (cvError || !cv) {
      return res.status(404).json({ error: "CV not found." });
    }

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

    // Get voice sample
    const { data: profile } = await supabase
      .from("profiles")
      .select("voice_sample")
      .eq("id", userId)
      .single();

    const voiceSample = profile?.voice_sample || null;
    const rawText = cv.raw_text;

    if (!rawText) {
      return res.status(400).json({
        error: "CV has not been parsed yet. Please re-upload your CV.",
      });
    }

    const jobDescription = job.job_description || "";

    // Use stored parsed sections or re-extract
    let sections = cv.parsed_sections;
    if (!sections || Object.keys(sections).length === 0) {
      console.log("No parsed_sections found — extracting from raw_text");
      sections = extractCVSections(rawText);
    }

    // Check for sections with enough content to be useful (must be > 20 chars, same threshold as the for loop)
    const processableSectionKeys = ["summary", "experience", "skills", "achievements", "projects"];
    const meaningfulSections = processableSectionKeys.filter(
      (k) => (sections[k]?.text?.trim().length ?? 0) > 20,
    );
    console.log("Meaningful sections found:", meaningfulSections);
    console.log("Raw text length:", rawText.length);

    // If no meaningful sections, rebuild from raw text
    if (meaningfulSections.length === 0) {
      console.warn("Section extraction found nothing useful — rebuilding from raw text");

      // These regexes work whether text has newlines or not (handles PDF.js inline output)
      const text = rawText;
      const summaryMatch = text.match(
        /(?:SUMMARY|PROFILE|ABOUT\s+ME|OBJECTIVE)\s*[:\-]?\s*([\s\S]*?)(?=\b(?:EXPERIENCE|EMPLOYMENT|WORK HISTORY|EDUCATION|SKILLS|ACHIEVEMENTS|PROJECTS)\b|$)/i,
      );
      const experienceMatch = text.match(
        /(?:EXPERIENCE|EMPLOYMENT|WORK HISTORY|CAREER HISTORY)\s*[:\-]?\s*([\s\S]*?)(?=\b(?:EDUCATION|SKILLS|CERTIF|ACHIEVEMENTS|PROJECTS)\b|$)/i,
      );
      const skillsMatch = text.match(
        /(?:SKILLS|COMPETENCIES|TECHNOLOGIES|TECHNICAL SKILLS)\s*[:\-]?\s*([\s\S]*?)(?=\b(?:EDUCATION|CERTIF|PORTFOLIO|REFERENCES|INTERESTS)\b|$)/i,
      );

      sections = {
        summary: {
          text: summaryMatch?.[1]?.trim() || text.slice(0, 600),
          bullets: [],
        },
        experience: {
          text: experienceMatch?.[1]?.trim() || text.slice(600, 2800),
          bullets: [],
        },
        skills: {
          text: skillsMatch?.[1]?.trim() || text.slice(2800, 3600),
          bullets: [],
        },
      };
      console.log("Rebuilt sections — summary len:", sections.summary.text.length, "exp len:", sections.experience.text.length);
    }

    // ── Smart selective rewriting ──────────────────────
    // Process all sections in parallel to avoid sequential AI call bottleneck

    const tailoredContent = {};
    const REWRITE_THRESHOLD = 75;
    const LIGHT_THRESHOLD = 50;
    const MAX_BULLETS = 5; // Cap to reduce total AI calls

    const sectionKeys = [
      "summary",
      "experience",
      "skills",
      "achievements",
      "projects",
    ];

    const processSection = async (key) => {
      const section = sections[key];
      if (!section?.text || section.text.trim().length < 20) return null;

      const sectionText = section.text;
      let bullets = section.bullets || [];

      const matchScore = await scoreSectionMatch(sectionText, jobDescription);
      console.log(`Section "${key}" match score: ${matchScore}`);

      if (matchScore >= REWRITE_THRESHOLD) {
        return [key, {
          original: sectionText,
          tailored: sectionText,
          bullets_original: bullets,
          bullets_tailored: bullets,
          rewrite_level: "none",
          match_score: matchScore,
          accepted: true,
        }];
      }

      // Build bullet list if not already extracted
      if (bullets.length === 0 && sectionText.length > 20) {
        bullets = sectionText
          .split("\n")
          .map((l) => l.replace(/^[○•\-\d.]\s*/, "").trim())
          .filter((l) => l.length > 20)
          .slice(0, MAX_BULLETS);
      }
      const bulletSlice = bullets.slice(0, MAX_BULLETS);

      if (matchScore >= LIGHT_THRESHOLD) {
        const rewrittenBullets = await Promise.all(
          bulletSlice.map((b) =>
            rewriteSingleBullet(b, jobDescription, voiceSample)
              .then((r) => r.trim())
              .catch(() => b),
          ),
        );
        return [key, {
          original: sectionText,
          tailored: rewrittenBullets.join("\n"),
          bullets_original: bulletSlice,
          bullets_tailored: rewrittenBullets,
          rewrite_level: "bullet",
          match_score: matchScore,
          accepted: null,
        }];
      }

      // Full rewrite + bullet rewrites in parallel
      const [rewritten, rewrittenBullets] = await Promise.all([
        rewriteCVSection(key, sectionText.slice(0, 1500), jobDescription, voiceSample),
        Promise.all(
          bulletSlice.map((b) =>
            rewriteSingleBullet(b, jobDescription, voiceSample)
              .then((r) => r.trim())
              .catch(() => b),
          ),
        ),
      ]);

      return [key, {
        original: sectionText,
        tailored: rewritten,
        bullets_original: bulletSlice,
        bullets_tailored: rewrittenBullets,
        rewrite_level: "full",
        match_score: matchScore,
        accepted: null,
      }];
    };

    // Run all sections in parallel
    const sectionResults = await Promise.all(sectionKeys.map(processSection));
    for (const result of sectionResults) {
      if (result) tailoredContent[result[0]] = result[1];
    }

    // Post-loop safety net — if nothing was processed, use raw text as a single experience section
    const sectionKeysProduced = Object.keys(tailoredContent);
    if (sectionKeysProduced.length === 0) {
      console.warn("For loop produced no sections — forcing raw text fallback");
      const chunks = [
        { key: "summary", text: rawText.slice(0, 600) },
        { key: "experience", text: rawText.slice(600, 2800) },
        { key: "skills", text: rawText.slice(2800, 3600) },
      ];
      for (const { key, text } of chunks) {
        if (text.trim().length > 20) {
          const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 20);
          tailoredContent[key] = {
            original: text.trim(),
            tailored: text.trim(),
            bullets_original: lines,
            bullets_tailored: lines,
            rewrite_level: "none",
            match_score: 50,
            accepted: null,
          };
        }
      }
    }

    // Education always kept as-is
    if (sections.education?.text) {
      tailoredContent.education = {
        original: sections.education.text,
        tailored: sections.education.text,
        bullets_original: sections.education.bullets || [],
        bullets_tailored: sections.education.bullets || [],
        rewrite_level: "none",
        match_score: 100,
        accepted: true,
      };
    }

    // Calculate match score and detect blind spots in parallel
    const [matchScore, blindSpots] = await Promise.all([
      calculateMatchScore(rawText, jobDescription),
      detectBlindSpots(rawText, jobDescription).catch((e) => {
        console.warn("Blind spot detection failed:", e.message);
        return [];
      }),
    ]);

    tailoredContent.match_score = matchScore;
    tailoredContent.blind_spots = blindSpots;
    tailoredContent.tone = tone;
    tailoredContent.contact_info = sections.contact_info || [];

    // Create CV version
    const versionName = `${job.job_title} at ${job.company_name}`;
    const { data: version, error: versionError } = await supabase
      .from("cv_versions")
      .insert({
        user_id: userId,
        cv_id: cvId,
        job_target_id: jobTargetId,
        version_name: versionName,
        tailored_content: tailoredContent,
        match_score: matchScore.overall_score || 0,
        ats_score: matchScore.breakdown?.keywords_match || 0,
        tone,
        is_active: true,
      })
      .select()
      .single();

    if (versionError) throw versionError;

    // Update job target match score
    await supabase
      .from("job_targets")
      .update({ match_score: matchScore.overall_score || 0 })
      .eq("id", jobTargetId)
      .eq("user_id", userId);

    console.log(
      "CV rewrite complete. Sections processed:",
      Object.keys(tailoredContent),
    );

    res.json({
      success: true,
      version,
      tailored_content: tailoredContent,
      match_score: matchScore,
    });
  } catch (error) {
    console.error("CV rewrite error:", error);
    res.status(500).json({
      error: "Failed to rewrite CV.",
      details: error.message,
    });
  }
};

// Get match score
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
      return res.status(400).json({ error: "CV or job description missing." });
    }

    const score = await calculateMatchScore(cv.raw_text, job.job_description);
    res.json({ success: true, score });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
