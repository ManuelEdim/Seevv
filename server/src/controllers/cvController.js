import { parseCV, extractCVSections, cleanText } from "../lib/cvParser.js";
import {
  rewriteSingleBullet,
  rewriteCVSection,
  calculateMatchScore,
  detectBlindSpots,
  scoreSectionMatch,
} from "../lib/ai.js";
import { supabase } from "../lib/supabase.js";

// ─── Parse an uploaded CV and save the raw text ───────────

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
    res.status(500).json({
      error: "Failed to parse CV.",
      details: error.message,
    });
  }
};

// ─── Bullet extractor ─────────────────────────────────────
// Handles both structured text (real line breaks) and flat
// PDF.js output (entire page as one long string)

const extractBulletsFromText = (text, max = 10) => {
  const cleaned = text.trim();

  // Strategy 1 — newline-based (clean structured text)
  const byLines = cleaned
    .split("\n")
    .map((l) => l.replace(/^[-•·▪▸►*○✓\d+.)\s]+/, "").trim())
    .filter((l) => l.length > 30 && l.length < 600);
  if (byLines.length >= 2) return byLines.slice(0, max);

  // Strategy 2 — inline bullet markers
  const byMarkers = cleaned
    .split(/\s*[•·▪▸►○✓]\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length > 30 && s.length < 600);
  if (byMarkers.length >= 2) return byMarkers.slice(0, max);

  // Strategy 3 — numbered list markers like "1. " "2. " "○ "
  const byNumbered = cleaned
    .split(/(?:\d+\.\s+|○\s+)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 30 && s.length < 600);
  if (byNumbered.length >= 2) return byNumbered.slice(0, max);

  // Strategy 4 — sentence boundaries (full sentences only)
  const bySentences = cleaned
    .split(/(?<=[.!?])\s+(?=[A-Z][a-z])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 40 && s.length < 600);
  if (bySentences.length >= 2) return bySentences.slice(0, max);

  // Strategy 5 — split on action verbs ONLY after sentence-ending punctuation
  // This prevents cutting mid-phrase like "Architected and..."
  const byVerbs = cleaned
    .split(
      /(?<=[.!?])\s+(?=(?:Built|Led|Developed|Created|Managed|Designed|Implemented|Delivered|Architected|Improved|Increased|Reduced|Launched|Drove|Established|Collaborated|Mentored|Migrated|Optimised|Optimized|Spearheaded|Engineered|Enhanced|Streamlined|Directed|Oversaw|Produced|Authored|Coordinated|Facilitated)\s)/i,
    )
    .map((s) => s.trim())
    .filter((s) => s.length > 40 && s.length < 600);
  if (byVerbs.length >= 2) return byVerbs.slice(0, max);

  // Fallback — return whole text as single block for AI to handle
  return cleaned.length > 30 ? [cleaned.slice(0, 800)] : [];
};

// ─── Smart selective CV rewriter ──────────────────────────

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
      console.log("No parsed_sections — extracting from raw_text");
      sections = extractCVSections(rawText);
    }

    // Check for meaningful sections
    const processableSectionKeys = [
      "summary",
      "experience",
      "skills",
      "achievements",
      "projects",
    ];
    const meaningfulSections = processableSectionKeys.filter(
      (k) => (sections[k]?.text?.trim().length ?? 0) > 20,
    );
    console.log("Meaningful sections:", meaningfulSections);
    console.log("Raw text length:", rawText.length);

    // If section extraction failed — use regex-based fallback
    if (meaningfulSections.length === 0) {
      console.warn("Section extraction failed — using regex fallback");

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

      console.log(
        "Rebuilt — summary:",
        sections.summary.text.length,
        "exp:",
        sections.experience.text.length,
        "skills:",
        sections.skills.text.length,
      );
    }

    // ── Scoring thresholds ────────────────────────────────
    const REWRITE_THRESHOLD = 75; // Keep original — already strong match
    const LIGHT_THRESHOLD = 50; // Bullet-by-bullet refinement
    // Below LIGHT_THRESHOLD → full section rewrite

    // ── Process a single section ──────────────────────────
    const processSection = async (key) => {
      const section = sections[key];
      if (!section?.text || section.text.trim().length < 20) return null;

      const sectionText = section.text;

      // Extract bullets — prefer stored, fall back to smart extractor
      const storedBullets = (section.bullets || []).filter(
        (b) => typeof b === "string" && b.length > 25,
      );
      const extractedBullets =
        storedBullets.length >= 2
          ? storedBullets.slice(0, 10)
          : extractBulletsFromText(sectionText, 10);

      // Score the section
      const matchScore = await scoreSectionMatch(sectionText, jobDescription);
      console.log(
        `Section "${key}" score: ${matchScore} | bullets: ${extractedBullets.length}`,
      );

      // ── High match — keep original ────────────────────
      if (matchScore >= REWRITE_THRESHOLD) {
        return [
          key,
          {
            original: sectionText,
            tailored: sectionText,
            bullets_original: extractedBullets,
            bullets_tailored: extractedBullets,
            rewrite_level: "none",
            match_score: matchScore,
            accepted: true,
          },
        ];
      }

      // ── Medium match — refine bullets ─────────────────
      if (matchScore >= LIGHT_THRESHOLD) {
        const rewrittenBullets = await Promise.all(
          extractedBullets.map((b) =>
            rewriteSingleBullet(b, jobDescription, voiceSample)
              .then((r) => r.trim())
              .catch(() => b),
          ),
        );

        return [
          key,
          {
            original: sectionText,
            tailored: rewrittenBullets.join("\n"),
            bullets_original: extractedBullets,
            bullets_tailored: rewrittenBullets,
            rewrite_level: "bullet",
            match_score: matchScore,
            accepted: null,
          },
        ];
      }

      // ── Low match — full rewrite ───────────────────────
      const [rewritten, rewrittenBullets] = await Promise.all([
        rewriteCVSection(
          key,
          sectionText.slice(0, 1500),
          jobDescription,
          voiceSample,
        ),
        Promise.all(
          extractedBullets.map((b) =>
            rewriteSingleBullet(b, jobDescription, voiceSample)
              .then((r) => r.trim())
              .catch(() => b),
          ),
        ),
      ]);

      return [
        key,
        {
          original: sectionText,
          tailored: rewritten,
          bullets_original: extractedBullets,
          bullets_tailored: rewrittenBullets,
          rewrite_level: "full",
          match_score: matchScore,
          accepted: null,
        },
      ];
    };

    // Process all sections in parallel
    const tailoredContent = {};
    const sectionResults = await Promise.all(
      processableSectionKeys.map(processSection),
    );
    for (const result of sectionResults) {
      if (result) tailoredContent[result[0]] = result[1];
    }

    // Safety net — if nothing processed, surface raw text
    if (Object.keys(tailoredContent).length === 0) {
      console.warn("All sections skipped — forcing from raw text");
      const expText = rawText.slice(0, 3000).trim();
      const bullets = extractBulletsFromText(expText, 10);
      tailoredContent.experience = {
        original: expText,
        tailored: expText,
        bullets_original: bullets,
        bullets_tailored: bullets,
        rewrite_level: "none",
        match_score: 50,
        accepted: null,
      };
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

    // Calculate overall match score and blind spots in parallel
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

    // Create CV version record
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
      "Rewrite complete. Sections:",
      Object.keys(tailoredContent).filter(
        (k) =>
          !["match_score", "blind_spots", "tone", "contact_info"].includes(k),
      ),
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

// ─── Get match score ──────────────────────────────────────

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
