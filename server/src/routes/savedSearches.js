import { Router } from "express";
import authMiddleware from "../middleware/auth.js";
import { supabase } from "../lib/supabase.js";

const router = Router();
router.use(authMiddleware);

// ─── GET /api/saved-searches ──────────────────────────────
router.get("/", async (req, res) => {
  const userId = req.user.id;
  try {
    const { data, error } = await supabase
      .from("saved_searches")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ searches: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/saved-searches ─────────────────────────────
router.post("/", async (req, res) => {
  const userId = req.user.id;
  const { query, filters, alertEnabled } = req.body;
  if (!query?.trim()) return res.status(400).json({ error: "query required" });

  try {
    const { data, error } = await supabase
      .from("saved_searches")
      .insert({ user_id: userId, query: query.trim(), filters: filters || {}, alert_enabled: alertEnabled || false })
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/saved-searches/:id — toggle alert ────────
router.patch("/:id", async (req, res) => {
  const userId = req.user.id;
  const { alertEnabled } = req.body;
  try {
    const { data, error } = await supabase
      .from("saved_searches")
      .update({ alert_enabled: alertEnabled })
      .eq("id", req.params.id)
      .eq("user_id", userId)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/saved-searches/:id ──────────────────────
router.delete("/:id", async (req, res) => {
  const userId = req.user.id;
  try {
    await supabase
      .from("saved_searches")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
