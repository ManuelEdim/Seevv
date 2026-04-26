import { Router } from "express";
import authMiddleware from "../middleware/auth.js";
import { parseJobDescription } from "../lib/ai.js";
import { supabase } from "../lib/supabase.js";

const router = Router();

router.use(authMiddleware);

// GET /api/jobs — fetch all job targets for the user
router.get("/", async (req, res) => {
  const userId = req.user.id;
  try {
    const { data, error } = await supabase
      .from("job_targets")
      .select("id, job_title, company_name, job_description, status, notes, applied_at, created_at, updated_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ jobs: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/jobs — create a new job target
router.post("/", async (req, res) => {
  const userId = req.user.id;
  const { job_title, company_name, job_description, location, salary_range, job_url, status = "saved" } = req.body;

  if (!job_title || !company_name) {
    return res.status(400).json({ error: "job_title and company_name are required" });
  }

  try {
    const { data, error } = await supabase
      .from("job_targets")
      .insert({ user_id: userId, job_title, company_name, job_description, location, salary_range, job_url, status })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/jobs/:id/status — update application status
router.patch("/:id/status", async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { status, notes } = req.body;

  const VALID_STATUSES = ["saved", "applied", "interview", "offer", "rejected"];
  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const updates = {};
  if (status) {
    updates.status = status;
    if (status === "applied") updates.applied_at = new Date().toISOString();
  }
  if (notes !== undefined) updates.notes = notes;
  updates.updated_at = new Date().toISOString();

  try {
    const { data, error } = await supabase
      .from("job_targets")
      .update(updates)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Strip HTML tags and extract readable text from a page
const extractTextFromHtml = (html) => {
  // Remove script and style blocks entirely
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    // Convert block-level tags to newlines
    .replace(/<\/(p|div|li|h[1-6]|section|article|br)>/gi, "\n")
    // Strip all remaining HTML tags
    .replace(/<[^>]+>/g, " ")
    // Decode common HTML entities
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    // Collapse whitespace while preserving line breaks
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text;
};

// POST /api/jobs/fetch-jd — fetch a job description from a URL
router.post("/fetch-jd", async (req, res) => {
  const { url } = req.body;

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "A valid URL is required" });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    return res.status(400).json({ error: "Invalid URL format" });
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return res
      .status(400)
      .json({ error: "Only HTTP and HTTPS URLs are supported" });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return res.status(502).json({
        error: `Could not fetch the page (HTTP ${response.status}). Try pasting the job description manually.`,
      });
    }

    const contentType = response.headers.get("content-type") || "";
    if (
      !contentType.includes("text/html") &&
      !contentType.includes("text/plain")
    ) {
      return res.status(422).json({
        error:
          "The URL does not appear to be a web page. Try pasting the job description manually.",
      });
    }

    const html = await response.text();
    const text = extractTextFromHtml(html);

    if (text.length < 100) {
      return res.status(422).json({
        error:
          "Could not extract enough text from this page. Try pasting the job description manually.",
      });
    }

    // Cap at 20,000 chars to avoid huge payloads
    res.json({ text: text.slice(0, 20000) });
  } catch (err) {
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      return res
        .status(504)
        .json({
          error: "The page took too long to respond. Try pasting manually.",
        });
    }
    res
      .status(502)
      .json({
        error:
          "Failed to fetch the page. Try pasting the job description manually.",
      });
  }
});

// POST /api/jobs/parse-jd — extract structured fields from JD text using AI
router.post("/parse-jd", async (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== "string" || text.trim().length < 50) {
    return res
      .status(400)
      .json({ error: "Job description text is required (min 50 characters)" });
  }

  try {
    const fields = await parseJobDescription(text);
    res.json(fields);
  } catch (err) {
    console.error("parse-jd error:", err.message);
    res.status(500).json({ error: "Failed to parse job description" });
  }
});

// POST /api/jobs/:jobId/decode — alias to the decoder route
router.post("/:jobId/decode", async (req, res) => {
  const { jobId } = req.params;
  const userId = req.user.id;
  try {
    const { data: job, error } = await supabase
      .from("job_targets")
      .select("job_title, company_name, job_description")
      .eq("id", jobId)
      .eq("user_id", userId)
      .single();
    if (error || !job) return res.status(404).json({ error: "Job not found" });
    res.json({ jobId, jobTitle: job.job_title, company: job.company_name, redirectTo: `/decoder?jobId=${jobId}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
