import { parseCV, extractCVSections, cleanText } from "../lib/cvParser.js";
import {
  rewriteBulletsInBatch,
  rewriteCVSection,
  calculateMatchScore,
  detectBlindSpots,
  scoreSectionMatch,
} from "../lib/ai.js";
import { supabase } from "../lib/supabase.js";

// ─── Parse an uploaded CV ─────────────────────────────────

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

    console.log(
      "Parsed sections:",
      Object.keys(sections).map(
        (k) => `${k}: ${sections[k]?.text?.length ?? 0} chars`,
      ),
    );

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

// ─── Bullet extractor (fallback) ─────────────────────────
// Used when parsed_sections is unavailable

const extractBulletsFromText = (text, max = 10) => {
  const cleaned = text.trim();

  // ○ bullets (experience format)
  const byCircle = cleaned
    .split(/○\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 35 && s.length < 600);
  if (byCircle.length >= 2) return byCircle.slice(0, max);

  // ● bullets (skills/new CV format)
  const byDot = cleaned
    .split(/●\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10 && s.length < 600);
  if (byDot.length >= 2) return byDot.slice(0, max);

  // Newline-based
  const byLines = cleaned
    .split("\n")
    .map((l) => l.replace(/^[-•·▪▸►*○●✓\d+.)\s]+/, "").trim())
    .filter((l) => l.length > 35 && l.length < 600);
  if (byLines.length >= 2) return byLines.slice(0, max);

  // Sentence boundaries
  const bySentences = cleaned
    .split(/(?<=[.!?])\s+(?=[A-Z][a-z])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 40 && s.length < 600);
  if (bySentences.length >= 2) return bySentences.slice(0, max);

  return cleaned.length > 30 ? [cleaned.slice(0, 800)] : [];
};

// ─── Parse experience into structured roles ───────────────
// Handles both CV formats:
// Old: "1. Role – Company\nDate\n○ bullet\n○ bullet"
// New: "1. Role\nCompany | Date\n● bullet\n● bullet"

const parseExperienceSection = (text) => {
  if (!text) return [];

  // Split on numbered role entries at start: "1. ", "2. " etc.
  const roleBlocks = text
    .split(/\n(?=\d+\.\s+[A-Z])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 30);

  if (roleBlocks.length === 0) {
    return [
      {
        title: "Experience",
        company: "",
        period: "",
        bullets: extractBulletsFromText(text, 10),
      },
    ];
  }

  return roleBlocks
    .map((block) => {
      // Remove leading number "1. "
      const withoutNumber = block.replace(/^\d+\.\s+/, "").trim();
      const lines = withoutNumber
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      if (lines.length === 0) return null;

      // ── Title line ─────────────────────────────────────
      let title = lines[0];
      let company = "";
      let period = "";
      let bulletStartLine = 1;

      // Check if title contains a dash separator "Role – Company"
      const titleDash = title.match(/^(.+?)\s*[–\-—]\s*(.+)$/);
      if (titleDash) {
        title = titleDash[1].trim();
        company = titleDash[2].trim();
      }

      // ── Second line — company / date ───────────────────
      if (lines[1] && !/^[○●\-•]/.test(lines[1])) {
        const secondLine = lines[1];

        // Try "Company | Date" or "Company – Date" split
        const pipeSplit = secondLine.match(/^(.+?)\s*[|]\s*(.+)$/);
        const dashSplit = secondLine.match(/^(.+?)\s*[–\-—]\s*(.+)$/);

        if (pipeSplit) {
          if (!company) company = pipeSplit[1].trim();
          period = pipeSplit[2].trim();
          bulletStartLine = 2;
        } else if (dashSplit && !company) {
          company = dashSplit[1].trim();
          period = dashSplit[2].trim();
          bulletStartLine = 2;
        } else if (
          /\d{4}|present|current|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i.test(
            secondLine,
          )
        ) {
          // Looks like a date line
          if (!company) {
            company = secondLine;
          } else {
            period = secondLine;
          }
          bulletStartLine = 2;
        } else if (secondLine.length < 80) {
          // Short line — treat as company if we don't have one
          if (!company) company = secondLine;
          bulletStartLine = 2;
        }
      }

      // ── Extract bullets ────────────────────────────────
      // Support both ○ (old CV) and ● (new CV) bullet formats
      const bulletLines = lines.slice(bulletStartLine);
      const bullets = bulletLines
        .map((l) => l.replace(/^[○●\-•·▪]\s*/, "").trim())
        .filter((l) => l.length > 20);

      // If no structured bullets found — try splitting the remaining
      // text on bullet markers inline
      if (bullets.length === 0) {
        const remaining = bulletLines.join(" ");
        const byMarker = remaining
          .split(/[○●]\s+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 20);
        if (byMarker.length > 0)
          return { title, company, period, bullets: byMarker };
      }

      return { title, company, period, bullets };
    })
    .filter((role) => role !== null && role.title.length > 0);
};

// ─── Smart selective CV rewriter ──────────────────────────

export const rewriteCVController = async (req, res) => {
  const { cvId, jobTargetId, tone = "balanced" } = req.body;
  const userId = req.user.id;

  try {
    const { data: cv, error: cvError } = await supabase
      .from("cvs")
      .select("*")
      .eq("id", cvId)
      .eq("user_id", userId)
      .single();

    if (cvError || !cv) {
      return res.status(404).json({ error: "CV not found." });
    }

    const { data: job, error: jobError } = await supabase
      .from("job_targets")
      .select("*")
      .eq("id", jobTargetId)
      .eq("user_id", userId)
      .single();

    if (jobError || !job) {
      return res.status(404).json({ error: "Job target not found." });
    }

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

    // Use stored parsed_sections if available, otherwise re-extract
    let sections = cv.parsed_sections;
    if (!sections || Object.keys(sections).length === 0) {
      console.log("No parsed_sections — extracting from raw_text now");
      sections = extractCVSections(rawText);

      // Save back so future rewrites are faster
      await supabase
        .from("cvs")
        .update({ parsed_sections: sections })
        .eq("id", cvId)
        .eq("user_id", userId);
    }

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

    // If still nothing — regex fallback on rawText
    if (meaningfulSections.length === 0) {
      console.warn("Section extraction found nothing — running regex fallback");

      const summaryMatch = rawText.match(
        /\bSUMMARY\b\s+([\s\S]*?)(?=\bEXPERIENCE\b|\bEDUCATION\b|\bSKILLS\b)/i,
      );
      const experienceMatch = rawText.match(
        /\bEXPERIENCE\b\s+([\s\S]*?)(?=\bCORE\s+SKILLS\b|\bSKILLS\b|\bEDUCATION\b|\bCERTIF\b)/i,
      );
      const skillsMatch = rawText.match(
        /\b(?:CORE\s+SKILLS|SKILLS)\b[^●\n]*?([\s\S]*?)(?=\bEDUCATION\b|\bCERTIF\b|\bPORTFOLIO\b|$)/i,
      );

      sections = {
        summary: {
          text: summaryMatch?.[1]?.trim() || rawText.slice(0, 600),
          bullets: [],
        },
        experience: {
          text: experienceMatch?.[1]?.trim() || rawText.slice(600, 2800),
          bullets: [],
        },
        skills: {
          text: skillsMatch?.[1]?.trim() || rawText.slice(2800, 3600),
          bullets: [],
        },
      };

      console.log(
        "Regex rebuilt — summary:",
        sections.summary.text.length,
        "| exp:",
        sections.experience.text.length,
        "| skills:",
        sections.skills.text.length,
      );
    }

    const REWRITE_THRESHOLD = 75;
    const LIGHT_THRESHOLD = 50;

    const processSection = async (key) => {
      const section = sections[key];
      if (!section?.text || section.text.trim().length < 20) return null;

      const sectionText = section.text;
      const matchScore = await scoreSectionMatch(sectionText, jobDescription);
      console.log(`Section "${key}" score: ${matchScore}`);

      // ── Experience — role-by-role ──────────────────────
      if (key === "experience") {
        const roles = parseExperienceSection(sectionText);
        console.log(`Experience: ${roles.length} roles found`);
        roles.forEach((r) =>
          console.log(
            `  Role: "${r.title}" | company: "${r.company}" | period: "${r.period}" | bullets: ${r.bullets.length}`,
          ),
        );

        if (matchScore >= REWRITE_THRESHOLD) {
          return [
            key,
            {
              original: sectionText,
              tailored: sectionText,
              roles_original: roles,
              roles_tailored: roles,
              rewrite_level: "none",
              match_score: matchScore,
              accepted: true,
            },
          ];
        }

        const rewrittenRoles = await Promise.all(
          roles.map(async (role) => {
            if (!role.bullets || role.bullets.length === 0) return role;
            const rewrote = await rewriteBulletsInBatch(
              role.bullets,
              `work experience for the role: ${role.title}`,
              jobDescription,
              voiceSample,
            );
            return {
              ...role,
              bullets_original: role.bullets,
              bullets: rewrote,
            };
          }),
        );

        return [
          key,
          {
            original: sectionText,
            tailored: rewrittenRoles
              .map((r) => r.bullets.join("\n"))
              .join("\n\n"),
            roles_original: roles,
            roles_tailored: rewrittenRoles,
            rewrite_level: matchScore >= LIGHT_THRESHOLD ? "bullet" : "full",
            match_score: matchScore,
            accepted: null,
          },
        ];
      }

      // ── Other sections ────────────────────────────────

      const storedBullets = (section.bullets || []).filter(
        (b) => typeof b === "string" && b.trim().length > 10,
      );

      let extractedBullets =
        storedBullets.length >= 1
          ? storedBullets.slice(0, 10)
          : extractBulletsFromText(sectionText, 10);

      const avgLength =
        extractedBullets.reduce((sum, b) => sum + b.length, 0) /
        (extractedBullets.length || 1);

      if (avgLength < 30 && extractedBullets.length > 0) {
        const bySentence = sectionText
          .split(/(?<=[.!?])\s+(?=[A-Z])/)
          .map((s) => s.trim())
          .filter((s) => s.length > 30 && s.length < 600);
        if (bySentence.length >= 2) {
          extractedBullets = bySentence.slice(0, 10);
        }
      }

      console.log(
        `Section "${key}" | bullets: ${extractedBullets.length} | avg len: ${Math.round(avgLength)}`,
      );

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

      const rewrittenBullets = await rewriteBulletsInBatch(
        extractedBullets,
        key,
        jobDescription,
        voiceSample,
      );

      let fullRewrite = rewrittenBullets.join("\n");
      if (matchScore < LIGHT_THRESHOLD) {
        try {
          fullRewrite = await rewriteCVSection(
            key,
            sectionText.slice(0, 1500),
            jobDescription,
            voiceSample,
          );
        } catch (e) {
          console.warn(`Full rewrite failed for ${key}:`, e.message);
        }
      }

      return [
        key,
        {
          original: sectionText,
          tailored:
            matchScore < LIGHT_THRESHOLD
              ? fullRewrite
              : rewrittenBullets.join("\n"),
          bullets_original: extractedBullets,
          bullets_tailored: rewrittenBullets,
          rewrite_level: matchScore < LIGHT_THRESHOLD ? "full" : "bullet",
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

    // Safety net
    if (Object.keys(tailoredContent).length === 0) {
      console.warn("All sections empty — forcing from raw text");
      const expText = rawText.slice(0, 3000).trim();
      tailoredContent.experience = {
        original: expText,
        tailored: expText,
        bullets_original: extractBulletsFromText(expText, 10),
        bullets_tailored: extractBulletsFromText(expText, 10),
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

    await supabase
      .from("job_targets")
      .update({ match_score: matchScore.overall_score || 0 })
      .eq("id", jobTargetId)
      .eq("user_id", userId);

    console.log(
      "Rewrite complete. Sections processed:",
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
