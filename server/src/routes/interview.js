import express from "express";
import { supabase } from "../lib/supabase.js";
import auth from "../middleware/auth.js";
import {
  generateInterviewPrepSheet,
  generateMockInterviewQuestions,
  scoreMockInterviewAnswer,
  buildMarketContext,
} from "../lib/ai.js";

const router = express.Router();
router.use(auth);

// POST /api/interview/prep
// Generate a full interview prep sheet for a job target
router.post("/prep", async (req, res) => {
  const { jobTargetId } = req.body;
  const userId = req.user.id;

  if (!jobTargetId) return res.status(400).json({ error: "jobTargetId required" });

  try {
    const [{ data: job, error: jobErr }, { data: cv }, { data: profile }] = await Promise.all([
      supabase
        .from("job_targets")
        .select("job_title, company_name, job_description")
        .eq("id", jobTargetId)
        .eq("user_id", userId)
        .single(),
      supabase
        .from("cvs")
        .select("raw_text")
        .eq("user_id", userId)
        .eq("is_active", true)
        .single(),
      supabase
        .from("profiles")
        .select("country, nysc_status")
        .eq("id", userId)
        .single(),
    ]);

    if (jobErr || !job) return res.status(404).json({ error: "Job target not found" });
    if (!cv?.raw_text) return res.status(404).json({ error: "No active CV found. Please upload your CV first." });

    const marketContext = buildMarketContext(profile?.country, profile?.nysc_status);

    const result = await generateInterviewPrepSheet(
      cv.raw_text,
      job.job_description || "",
      job.company_name,
      job.job_title,
      null,
      marketContext,
    );

    res.json({ result, jobTitle: job.job_title, company: job.company_name });
  } catch (err) {
    console.error("Interview prep error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/interview/questions
// Generate 5 stress-test mock interview questions from the user's CV
router.post("/questions", async (req, res) => {
  const { jobTargetId } = req.body;
  const userId = req.user.id;

  if (!jobTargetId) return res.status(400).json({ error: "jobTargetId required" });

  try {
    const [{ data: job, error: jobErr }, { data: cv }, { data: profile }] = await Promise.all([
      supabase
        .from("job_targets")
        .select("job_title, company_name, job_description")
        .eq("id", jobTargetId)
        .eq("user_id", userId)
        .single(),
      supabase
        .from("cvs")
        .select("raw_text")
        .eq("user_id", userId)
        .eq("is_active", true)
        .single(),
      supabase
        .from("profiles")
        .select("country, nysc_status")
        .eq("id", userId)
        .single(),
    ]);

    if (jobErr || !job) return res.status(404).json({ error: "Job target not found" });
    if (!cv?.raw_text) return res.status(404).json({ error: "No active CV found" });

    const marketContext = buildMarketContext(profile?.country, profile?.nysc_status);

    const questions = await generateMockInterviewQuestions(
      cv.raw_text,
      job.job_title,
      job.company_name,
      job.job_description || "",
      marketContext,
    );

    res.json({ questions, jobTitle: job.job_title, company: job.company_name });
  } catch (err) {
    console.error("Mock interview questions error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/interview/score
// Score a single mock interview answer
router.post("/score", async (req, res) => {
  const { question, answer, cvReference, jobTitle } = req.body;

  if (!question || !answer) {
    return res.status(400).json({ error: "question and answer required" });
  }

  try {
    const result = await scoreMockInterviewAnswer(
      question,
      answer,
      cvReference || "",
      jobTitle || "the role",
    );

    res.json(result);
  } catch (err) {
    console.error("Answer scoring error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
