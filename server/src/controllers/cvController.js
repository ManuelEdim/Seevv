import { parseCV, extractCVSections, cleanText } from "../lib/cvParser.js";
import {
  rewriteBulletsInBatch,
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

const extractBulletsFromText = (text, max = 10) => {
  const cleaned = text.trim();

  // Strategy 1 — newline-based
  const byLines = cleaned
    .split("\n")
    .map((l) => l.replace(/^[-•·▪▸►*○✓\d+.)\s]+/, "").trim())
    .filter((l) => l.length > 35 && l.length < 600);
  if (byLines.length >= 2) return byLines.slice(0, max);

  // Strategy 2 — inline bullet markers
  const byMarkers = cleaned
    .split(/\s*[•·▪▸►○✓]\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length > 35 && s.length < 600);
  if (byMarkers.length >= 2) return byMarkers.slice(0, max);

  // Strategy 3 — circle bullets (○) specifically
  const byCircle = cleaned
    .split(/○\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 35 && s.length < 600);
  if (byCircle.length >= 2) return byCircle.slice(0, max);

  // Strategy 4 — sentence boundaries
  const bySentences = cleaned
    .split(/(?<=[.!?])\s+(?=[A-Z][a-z])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 40 && s.length < 600);
  if (bySentences.length >= 2) return bySentences.slice(0, max);

  // Strategy 5 — split on action verbs ONLY after sentence-ending punctuation
  const byVerbs = cleaned
    .split(
      /(?<=[.!?])\s+(?=(?:Built|Led|Developed|Created|Managed|Designed|Implemented|Delivered|Architected|Improved|Increased|Reduced|Launched|Drove|Established|Collaborated|Mentored|Migrated|Optimised|Optimized|Spearheaded|Engineered|Enhanced|Streamlined|Directed|Oversaw|Produced|Authored|Coordinated|Facilitated|Supported|Assisted|Contributed|Modernized|Modernised)\s)/i,
    )
    .map((s) => s.trim())
    .filter((s) => s.length > 40 && s.length < 600);
  if (byVerbs.length >= 2) return byVerbs.slice(0, max);

  // Fallback — whole text as single block
  return cleaned.length > 30 ? [cleaned.slice(0, 800)] : [];
};

// ─── Parse experience into structured roles ───────────────

const parseExperienceSection = (text) => {
  if (!text) return [];

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const roles = [];
  let currentRole = null;
  let currentBullets = [];

  const isRoleTitle = (line) => {
    // Matches patterns like "Lead Frontend Developer – RemoteHealth"
    // or "Frontend Developer" followed by company on next line
    const titlePatterns = [/^.{5,60}(?:\s*[-–—]\s*.{3,})?$/];
    const bulletPatterns = /^[-•·▪▸►*○✓]|^\d+\./;
    const isShort = line.length < 80;
    const isNotBullet = !bulletPatterns.test(line);
    const hasCapital = /^[A-Z]/.test(line);
    const looksLikeTitle =
      /developer|engineer|designer|manager|director|intern|consultant|analyst|architect|lead|senior|junior|frontend|backend|fullstack|full-stack/i.test(
        line,
      );

    return isShort && isNotBullet && hasCapital && looksLikeTitle;
  };

  const isCompanyLine = (line) => {
    return (
      line.length < 80 &&
      /\d{4}|present|current|freelance|contract|remote|ltd|inc|llc|solutions|company/i.test(
        line,
      )
    );
  };

  const isBullet = (line) => {
    return (
      /^[-•·▪▸►*○✓]/.test(line) ||
      /^\d+\./.test(line) ||
      (line.length > 30 &&
        /^(?:Built|Led|Developed|Created|Managed|Designed|Implemented|Delivered|Architected|Improved|Increased|Reduced|Launched|Drove|Established|Collaborated|Mentored|Migrated|Optimised|Optimized|Spearheaded|Engineered|Enhanced|Streamlined|Directed|Oversaw|Produced|Authored|Coordinated|Facilitated|Supported|Assisted|Contributed|Modernized|Modernised)\s/i.test(
          line,
        ))
    );
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (isRoleTitle(line)) {
      // Save previous role
      if (currentRole && currentBullets.length > 0) {
        roles.push({ ...currentRole, bullets: currentBullets });
      }
      currentRole = { title: line, company: "", period: "" };
      currentBullets = [];

      // Check if next line is company/date
      if (i + 1 < lines.length && isCompanyLine(lines[i + 1])) {
        currentRole.company = lines[i + 1];
        i++;
      }
    } else if (isBullet(line) && currentRole) {
      const cleaned = line
        .replace(/^[-•·▪▸►*○✓]\s*/, "")
        .replace(/^\d+\.\s*/, "")
        .trim();
      if (cleaned.length > 20) {
        currentBullets.push(cleaned);
      }
    }
  }

  // Save last role
  if (currentRole && currentBullets.length > 0) {
    roles.push({ ...currentRole, bullets: currentBullets });
  }

  // If no roles found — fall back to flat bullets
  if (roles.length === 0) {
    return [
      {
        title: "Experience",
        company: "",
        period: "",
        bullets: extractBulletsFromText(text, 10),
      },
    ];
  }

  return roles;
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

    // Use stored parsed sections or re-extract
    let sections = cv.parsed_sections;
    if (!sections || Object.keys(sections).length === 0) {
      console.log("No parsed_sections — extracting from raw_text");
      sections = extractCVSections(rawText);
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

    // Regex fallback if extraction failed
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

    const REWRITE_THRESHOLD = 75;
    const LIGHT_THRESHOLD = 50;

    const processSection = async (key) => {
      const section = sections[key];
      if (!section?.text || section.text.trim().length < 20) return null;

      const sectionText = section.text;
      const matchScore = await scoreSectionMatch(sectionText, jobDescription);
      console.log(`Section "${key}" score: ${matchScore}`);

      // ── Experience — parse into structured roles ──────
      if (key === "experience") {
        const roles = parseExperienceSection(sectionText);
        console.log(`Experience: ${roles.length} roles found`);
        roles.forEach((r) =>
          console.log(`  Role: "${r.title}" | bullets: ${r.bullets.length}`),
        );

        // High match — keep original
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

        // Rewrite each role's bullets as a batch
        const rewrittenRoles = await Promise.all(
          roles.map(async (role) => {
            if (!role.bullets || role.bullets.length === 0) return role;
            const rewrote = await rewriteBulletsInBatch(
              role.bullets,
              `work experience (${role.title})`,
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

      // Extract bullets with quality check
      const storedBullets = (section.bullets || []).filter(
        (b) => typeof b === "string" && b.trim().length > 35,
      );

      let extractedBullets =
        storedBullets.length >= 2
          ? storedBullets.slice(0, 10)
          : extractBulletsFromText(sectionText, 10);

      // If avg bullet length is too short, retry with sentence splitting
      const avgLength =
        extractedBullets.reduce((sum, b) => sum + b.length, 0) /
        (extractedBullets.length || 1);

      if (avgLength < 40 && extractedBullets.length > 0) {
        const bySentence = sectionText
          .split(/(?<=[.!?])\s+(?=[A-Z])/)
          .map((s) => s.trim())
          .filter((s) => s.length > 40 && s.length < 600);
        if (bySentence.length >= 2) {
          extractedBullets = bySentence.slice(0, 10);
        }
      }

      console.log(
        `Section "${key}" | bullets: ${extractedBullets.length} | avg len: ${Math.round(avgLength)}`,
      );

      // High match — keep original
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

      // Use batch rewriting for complete, non-truncated bullets
      const rewrittenBullets = await rewriteBulletsInBatch(
        extractedBullets,
        key,
        jobDescription,
        voiceSample,
      );

      // Full rewrite for low-match sections
      let fullRewrite = sectionText;
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
          fullRewrite = rewrittenBullets.join("\n");
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

    // Calculate overall match score and blind spots
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
