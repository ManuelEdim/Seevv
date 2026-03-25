import { Router } from "express";
import authMiddleware from "../middleware/auth.js";
import { parseJobDescription } from "../lib/ai.js";

const router = Router();

router.use(authMiddleware);

router.get("/", (req, res) => {
  res.json({
    message: "Get all jobs — coming in Phase 4",
    userId: req.user.id,
  });
});

router.post("/", (req, res) => {
  res.json({ message: "Create job target — coming in Phase 4" });
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
    return res.status(400).json({ error: "Only HTTP and HTTPS URLs are supported" });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
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
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
      return res.status(422).json({
        error: "The URL does not appear to be a web page. Try pasting the job description manually.",
      });
    }

    const html = await response.text();
    const text = extractTextFromHtml(html);

    if (text.length < 100) {
      return res.status(422).json({
        error: "Could not extract enough text from this page. Try pasting the job description manually.",
      });
    }

    // Cap at 20,000 chars to avoid huge payloads
    res.json({ text: text.slice(0, 20000) });
  } catch (err) {
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      return res.status(504).json({ error: "The page took too long to respond. Try pasting manually." });
    }
    res.status(502).json({ error: "Failed to fetch the page. Try pasting the job description manually." });
  }
});

// POST /api/jobs/parse-jd — extract structured fields from JD text using AI
router.post("/parse-jd", async (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== "string" || text.trim().length < 50) {
    return res.status(400).json({ error: "Job description text is required (min 50 characters)" });
  }

  try {
    const fields = await parseJobDescription(text);
    res.json(fields);
  } catch (err) {
    console.error("parse-jd error:", err.message);
    res.status(500).json({ error: "Failed to parse job description" });
  }
});

router.post("/:jobId/decode", (req, res) => {
  res.json({ message: "Decode job — coming in Phase 4" });
});

export default router;
