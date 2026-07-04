import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import {
  sendInterviewReminder,
  sendWeeklyDigest,
  sendJobMatchAlert,
} from "../lib/emailService.js";

const router = Router();

// All cron endpoints are protected by a shared secret — not user auth
router.use((req, res, next) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) return res.status(503).json({ error: "CRON_SECRET not configured" });
  const provided = (req.headers.authorization || "").replace("Bearer ", "");
  if (provided !== secret) return res.status(401).json({ error: "Unauthorized" });
  next();
});

// ─── POST /api/cron/digest ────────────────────────────────────
// Called daily by GitHub Actions (.github/workflows/cron.yml)
// Sends: interview reminders (24h before), weekly digests (Mondays),
// job match alerts (when saved searches have new matches)
router.post("/digest", async (req, res) => {
  const results = { reminders: 0, digests: 0, alerts: 0, errors: [] };
  const today = new Date();
  const isMonday = today.getUTCDay() === 1;

  try {
    // ── 1. Interview reminders — interviews within next 18–30 hours ──
    const in18h = new Date(today.getTime() + 18 * 60 * 60 * 1000).toISOString();
    const in30h = new Date(today.getTime() + 30 * 60 * 60 * 1000).toISOString();

    const { data: upcoming } = await supabase
      .from("job_targets")
      .select("user_id, job_title, company_name, interview_date")
      .gte("interview_date", in18h)
      .lte("interview_date", in30h)
      .not("interview_date", "is", null);

    for (const job of upcoming || []) {
      try {
        await sendInterviewReminder(job.user_id, {
          jobTitle: job.job_title,
          company: job.company_name,
          interviewDate: job.interview_date,
        });
        results.reminders++;
      } catch (e) {
        results.errors.push(`reminder:${job.user_id}: ${e.message}`);
      }
    }

    // ── 2. Weekly digest — only on Mondays ───────────────────
    if (isMonday) {
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data: activeUsers } = await supabase
        .from("profiles")
        .select("id")
        .not("plan", "eq", "free");

      for (const profile of activeUsers || []) {
        try {
          const [{ data: apps }, { data: interviews }, { data: cvs }] = await Promise.all([
            supabase.from("job_targets").select("id").eq("user_id", profile.id).gte("created_at", weekAgo),
            supabase.from("job_targets").select("id").eq("user_id", profile.id).gte("interview_date", today.toISOString()),
            supabase.from("cv_versions").select("match_score").eq("user_id", profile.id).gte("created_at", weekAgo),
          ]);

          const scores = (cvs || []).map((v) => v.match_score).filter(Boolean);
          const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

          if ((apps || []).length > 0 || (interviews || []).length > 0) {
            await sendWeeklyDigest(profile.id, {
              applications: apps || [],
              upcomingInterviews: interviews || [],
              matchScore: avgScore,
            });
            results.digests++;
          }
        } catch (e) {
          results.errors.push(`digest:${profile.id}: ${e.message}`);
        }
      }
    }

    // ── 3. Job match alerts — saved searches with alert enabled ──
    // This is a stub: in production you'd compare against a real job board feed.
    // For now we skip unless a job_board_last_scraped timestamp is maintained.
    // Marking as 0 so the endpoint still runs cleanly.

    res.json({ ok: true, ...results });
  } catch (err) {
    console.error("Cron digest error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
