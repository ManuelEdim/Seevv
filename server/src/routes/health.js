import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const router = Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

router.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "Seevv API",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// List available models
router.get("/models", async (req, res) => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`,
    );
    const data = await response.json();
    const models = data.models
      ?.filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => m.name);
    res.json({ available_models: models });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Test AI connection
router.get("/ai", async (req, res) => {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(
      "Say 'Seevv AI is connected' and nothing else.",
    );
    const text = result.response.text();
    res.json({ status: "ok", message: text.trim() });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Debug — inspect raw_text and parsed_sections for a CV
router.get("/cv-debug/:cvId", async (req, res) => {
  try {
    const { data: cv, error } = await supabase
      .from("cvs")
      .select("raw_text, parsed_sections, file_name, file_type")
      .eq("id", req.params.cvId)
      .single();

    if (error || !cv) {
      return res.status(404).json({ error: "CV not found." });
    }

    const rawText = cv?.raw_text || "";

    res.json({
      file_name: cv.file_name,
      file_type: cv.file_type,
      raw_text_length: rawText.length,
      newline_count: (rawText.match(/\n/g) || []).length,
      first_500_chars: rawText.slice(0, 500),
      chars_500_to_1000: rawText.slice(500, 1000),
      last_200_chars: rawText.slice(-200),
      section_markers: {
        has_summary: /SUMMARY/i.test(rawText),
        has_experience: /EXPERIENCE/i.test(rawText),
        has_skills: /SKILLS/i.test(rawText),
        has_education: /EDUCATION/i.test(rawText),
        summary_index: rawText.toUpperCase().indexOf("SUMMARY"),
        experience_index: rawText.toUpperCase().indexOf("EXPERIENCE"),
        skills_index: rawText.toUpperCase().indexOf("SKILLS"),
        education_index: rawText.toUpperCase().indexOf("EDUCATION"),
      },
      chars_around_summary: (() => {
        const idx = rawText.toUpperCase().indexOf("SUMMARY");
        return idx > -1
          ? rawText.slice(Math.max(0, idx - 20), idx + 100)
          : "NOT FOUND";
      })(),
      chars_around_experience: (() => {
        const idx = rawText.toUpperCase().indexOf("EXPERIENCE");
        return idx > -1
          ? rawText.slice(Math.max(0, idx - 20), idx + 100)
          : "NOT FOUND";
      })(),
      parsed_sections_keys: Object.keys(cv?.parsed_sections || {}),
      parsed_sections_lengths: Object.fromEntries(
        Object.entries(cv?.parsed_sections || {}).map(([k, v]) => [
          k,
          typeof v === "object" && v !== null
            ? (v?.text?.length ?? JSON.stringify(v).length)
            : 0,
        ]),
      ),
      parsed_sections_preview: Object.fromEntries(
        Object.entries(cv?.parsed_sections || {}).map(([k, v]) => [
          k,
          typeof v === "object" && v?.text
            ? v.text.slice(0, 150)
            : Array.isArray(v)
              ? v.slice(0, 2)
              : String(v).slice(0, 150),
        ]),
      ),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
