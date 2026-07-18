import { Router } from "express";
import authMiddleware from "../middleware/auth.js";
import { supabase } from "../lib/supabase.js";
import { getProvider } from "../lib/aiProvider.js";

const router = Router();
router.use(authMiddleware);

// GET /api/journal
router.get("/", async (req, res) => {
  const userId = req.user.id;
  const { period, category, limit = 100, offset = 0 } = req.query;

  try {
    let query = supabase
      .from("achievement_logs")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (period && period !== "all") query = query.eq("period", period);
    if (category && category !== "all") query = query.eq("category", category);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ entries: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/journal
router.post("/", async (req, res) => {
  const userId = req.user.id;
  const { title, description, date, category, period, impact_score, cv_sections, tags } = req.body;

  if (!title?.trim()) return res.status(400).json({ error: "title is required" });

  try {
    const { data, error } = await supabase
      .from("achievement_logs")
      .insert({
        user_id: userId,
        title: title.trim(),
        description: description?.trim() || null,
        date: date || new Date().toISOString().split("T")[0],
        category: category || "career",
        period: period || "daily",
        impact_score: impact_score || 5,
        cv_sections: cv_sections || [],
        tags: tags || [],
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/journal/:id
router.patch("/:id", async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { title, description, date, category, period, impact_score, cv_sections, tags } = req.body;

  const updates = { updated_at: new Date().toISOString() };
  if (title !== undefined) updates.title = title.trim();
  if (description !== undefined) updates.description = description?.trim() || null;
  if (date !== undefined) updates.date = date;
  if (category !== undefined) updates.category = category;
  if (period !== undefined) updates.period = period;
  if (impact_score !== undefined) updates.impact_score = impact_score;
  if (cv_sections !== undefined) updates.cv_sections = cv_sections;
  if (tags !== undefined) updates.tags = tags;

  try {
    const { data, error } = await supabase
      .from("achievement_logs")
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

// DELETE /api/journal/:id
router.delete("/:id", async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from("achievement_logs")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/journal/summarize — AI turns entries into CV bullet points
router.post("/summarize", async (req, res) => {
  const userId = req.user.id;
  const { entryIds, cvSection = "experience" } = req.body;

  try {
    let query = supabase
      .from("achievement_logs")
      .select("title, description, category, impact_score, date")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(20);

    if (entryIds?.length) query = query.in("id", entryIds);

    const { data: entries, error } = await query;
    if (error) throw error;
    if (!entries?.length) return res.status(400).json({ error: "No entries to summarise" });

    const provider = await getProvider();
    const entriesText = entries
      .map((e) => `• ${e.title}${e.description ? ` — ${e.description}` : ""} (self-rated impact: ${e.impact_score}/10)`)
      .join("\n");

    const text = await provider.generate(
      `Convert these professional achievements into polished bullet points for the "${cvSection}" section of a CV/resume. Use strong action verbs, be specific, quantify where possible, and keep each bullet to one concise line. Do not add preamble.\n\n${entriesText}\n\nReturn 3–5 bullet points, each starting with •`,
      { maxTokens: 500 },
    );

    const bullets = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.startsWith("•") || l.startsWith("-"))
      .map((l) => l.replace(/^[-•]\s*/, "").trim())
      .filter(Boolean);

    res.json({ bullets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
