import express from "express";
import { supabase } from "../lib/supabase.js";
import recruiterAuth from "../middleware/recruiterAuth.js";
import { rankCandidates, extractSkillProfile, calculateMatchScore } from "../lib/ai.js";
import { getEmailProvider } from "../lib/emailProvider.js";

const router = express.Router();
router.use(recruiterAuth);

// ─── GET /api/recruiter/candidates ────────────────────────
// List all candidates with aggregated performance data
router.get("/candidates", async (req, res) => {
  const { search, country, level } = req.query;

  try {
    // Fetch all non-recruiter profiles with their CVs and version stats
    let query = supabase
      .from("profiles")
      .select(`
        id, full_name, country, nysc_status, created_at,
        cvs(id, is_active, raw_text),
        cv_versions(match_score, ats_score, created_at,
          job_target:job_targets(status)
        )
      `)
      .not("role", "eq", "recruiter")
      .order("created_at", { ascending: false });

    const { data: profiles, error } = await query;
    if (error) throw error;

    // Build enriched candidate list
    const candidates = (profiles || []).map((p) => {
      const activeCV = p.cvs?.find((c) => c.is_active) || p.cvs?.[0];
      const versions = p.cv_versions || [];
      const scores = versions.map((v) => v.match_score || 0).filter(Boolean);
      const avgScore = scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;
      const bestScore = scores.length ? Math.max(...scores) : 0;
      const statuses = versions.map((v) => v.job_target?.status).filter(Boolean);
      const interviewCount = statuses.filter((s) => s === "interview" || s === "offer").length;
      const offerCount = statuses.filter((s) => s === "offer").length;

      return {
        id: p.id,
        name: p.full_name || "Anonymous",
        country: p.country,
        nysc_status: p.nysc_status,
        joinedAt: p.created_at,
        hasCv: !!activeCV,
        cvWordCount: activeCV?.raw_text ? activeCV.raw_text.split(/\s+/).length : 0,
        totalApplications: versions.length,
        avgMatchScore: avgScore,
        bestMatchScore: bestScore,
        interviewCount,
        offerCount,
        interviewRate: versions.length ? Math.round((interviewCount / versions.length) * 100) : 0,
      };
    });

    // Client-side filtering
    let filtered = candidates;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((c) => c.name.toLowerCase().includes(q));
    }
    if (country) {
      filtered = filtered.filter((c) => c.country === country);
    }

    res.json({ candidates: filtered, total: filtered.length });
  } catch (err) {
    console.error("Recruiter candidates error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/recruiter/candidate/:userId ─────────────────
// Full candidate profile: CV text, all versions, job targets
router.get("/candidate/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const [
      { data: profile },
      { data: cvs },
      { data: versions },
      { data: jobs },
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("cvs").select("id, file_name, is_active, raw_text, created_at").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("cv_versions").select("id, version_name, match_score, ats_score, tone, created_at, job_target:job_targets(job_title, company_name, status)").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("job_targets").select("id, job_title, company_name, status, priority, created_at").eq("user_id", userId).order("created_at", { ascending: false }),
    ]);

    if (!profile) return res.status(404).json({ error: "Candidate not found" });

    const activeCV = cvs?.find((c) => c.is_active) || cvs?.[0];
    const scores = (versions || []).map((v) => v.match_score || 0).filter(Boolean);
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const bestScore = scores.length ? Math.max(...scores) : 0;
    const statuses = (jobs || []).map((j) => j.status);
    const statusCounts = statuses.reduce((acc, s) => ({ ...acc, [s]: (acc[s] || 0) + 1 }), {});

    res.json({
      profile: {
        id: profile.id,
        name: profile.full_name || "Anonymous",
        country: profile.country,
        nysc_status: profile.nysc_status,
        joinedAt: profile.created_at,
      },
      cv: activeCV ? {
        id: activeCV.id,
        fileName: activeCV.file_name,
        wordCount: activeCV.raw_text?.split(/\s+/).length || 0,
        rawText: activeCV.raw_text?.slice(0, 3000) || "",
      } : null,
      stats: {
        totalApplications: jobs?.length || 0,
        totalVersions: versions?.length || 0,
        avgMatchScore: avgScore,
        bestMatchScore: bestScore,
        statusCounts,
        interviewRate: jobs?.length
          ? Math.round((((statusCounts.interview || 0) + (statusCounts.offer || 0)) / jobs.length) * 100)
          : 0,
      },
      versions: (versions || []).slice(0, 20),
      recentJobs: (jobs || []).slice(0, 10),
    });
  } catch (err) {
    console.error("Candidate detail error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/recruiter/rank ──────────────────────────────
// Rank candidates (paste CVs OR select from platform)
router.post("/rank", async (req, res) => {
  const { jobDescription, candidates, userIds } = req.body;

  if (!jobDescription) return res.status(400).json({ error: "jobDescription required" });

  try {
    let toRank = [];

    if (userIds?.length) {
      // Fetch CVs from platform candidates by userId
      const { data: cvData } = await supabase
        .from("cvs")
        .select("user_id, raw_text, profiles!inner(full_name)")
        .in("user_id", userIds.slice(0, 5))
        .eq("is_active", true);

      toRank = (cvData || [])
        .filter((c) => c.raw_text?.trim().length >= 50)
        .map((c) => ({
          name: c.profiles?.full_name || "Candidate",
          cvText: c.raw_text,
        }));
    } else if (candidates?.length) {
      // Manual paste
      toRank = candidates.filter((c) => c.name?.trim() && c.cvText?.trim().length >= 50).slice(0, 5);
    }

    if (toRank.length < 2) return res.status(400).json({ error: "At least 2 valid candidates required" });

    const result = await rankCandidates(jobDescription, toRank);
    res.json(result);
  } catch (err) {
    console.error("Recruiter rank error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/recruiter/skill-profile ────────────────────
// Extract skill profile for a specific platform candidate
router.post("/skill-profile", async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "userId required" });

  try {
    const { data: cv } = await supabase
      .from("cvs")
      .select("raw_text")
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (!cv?.raw_text) return res.status(404).json({ error: "No CV found for this candidate" });

    const profile = await extractSkillProfile(cv.raw_text);
    res.json(profile);
  } catch (err) {
    console.error("Skill profile error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/recruiter/platform-stats ────────────────────
// Platform-wide overview stats
router.get("/platform-stats", async (req, res) => {
  try {
    const [
      { count: totalUsers },
      { count: totalCVs },
      { data: versions },
      { data: jobs },
    ] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }).not("role", "eq", "recruiter"),
      supabase.from("cvs").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("cv_versions").select("match_score, ats_score"),
      supabase.from("job_targets").select("status"),
    ]);

    const scores = (versions || []).map((v) => v.match_score || 0).filter(Boolean);
    const avgPlatformScore = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    const statuses = (jobs || []).map((j) => j.status);
    const statusCounts = statuses.reduce((acc, s) => ({ ...acc, [s]: (acc[s] || 0) + 1 }), {});
    const interviews = (statusCounts.interview || 0) + (statusCounts.offer || 0);
    const interviewRate = statuses.length
      ? Math.round((interviews / statuses.length) * 100)
      : 0;

    res.json({
      totalUsers: totalUsers || 0,
      totalActiveCVs: totalCVs || 0,
      totalApplications: statuses.length,
      avgPlatformScore,
      interviewRate,
      statusCounts,
      interviews,
      offers: statusCounts.offer || 0,
    });
  } catch (err) {
    console.error("Platform stats error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/recruiter/match-jd ────────────────────────
// Score a single candidate against a job description
router.post("/match-jd", async (req, res) => {
  const { userId, jobDescription } = req.body;
  if (!userId || !jobDescription) return res.status(400).json({ error: "userId and jobDescription required" });

  try {
    const { data: cv } = await supabase
      .from("cvs")
      .select("raw_text")
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (!cv?.raw_text) return res.status(404).json({ error: "No active CV found for this candidate" });

    const result = await calculateMatchScore(cv.raw_text, jobDescription);
    res.json(result);
  } catch (err) {
    console.error("Match JD error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/recruiter/bulk-outreach ───────────────────
// Send a personalised message to multiple candidates
router.post("/bulk-outreach", async (req, res) => {
  const { candidateIds, subject, message } = req.body;
  if (!candidateIds?.length || !subject || !message)
    return res.status(400).json({ error: "candidateIds, subject, and message required" });
  if (candidateIds.length > 50)
    return res.status(400).json({ error: "Max 50 candidates per outreach batch" });

  try {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", candidateIds);

    if (error) throw error;

    const emailProvider = await getEmailProvider();
    const results = { sent: 0, failed: 0, errors: [] };

    for (const profile of profiles || []) {
      if (!profile.email) { results.failed++; continue; }

      const personalised = message
        .replace(/\{\{name\}\}/gi, profile.full_name || "there")
        .replace(/\{\{first_name\}\}/gi, (profile.full_name || "there").split(" ")[0]);

      try {
        await emailProvider.send({
          to: profile.email,
          subject,
          html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">${personalised.replace(/\n/g, "<br>")}</div>`,
          text: personalised,
        });
        results.sent++;
      } catch (err) {
        results.failed++;
        results.errors.push({ id: profile.id, error: err.message });
      }
    }

    res.json(results);
  } catch (err) {
    console.error("Bulk outreach error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/recruiter/flag-candidate ───────────────────
// Submit a moderation flag on a candidate profile
router.post("/flag-candidate", async (req, res) => {
  const { candidateId, reason, details } = req.body;
  if (!candidateId || !reason) return res.status(400).json({ error: "candidateId and reason required" });

  try {
    const { error } = await supabase.from("moderation_flags").insert({
      content_type: "profile",
      content_id: candidateId,
      reporter_id: req.user.id,
      reason,
      status: "pending",
    });
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
