import { Router } from "express";
import authMiddleware from "../middleware/auth.js";
import { supabase } from "../lib/supabase.js";

const router = Router();
router.use(authMiddleware);

// ─── GET /api/shortlists ─────────────────────────────────────
router.get("/", async (req, res) => {
  const userId = req.user.id;
  try {
    const { data, error } = await supabase
      .from("candidate_shortlists")
      .select("*, candidates:shortlist_candidates(count)")
      .eq("recruiter_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ shortlists: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/shortlists ─────────────────────────────────────
router.post("/", async (req, res) => {
  const userId = req.user.id;
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: "name required" });
  try {
    const { data, error } = await supabase
      .from("candidate_shortlists")
      .insert({ recruiter_id: userId, name, description })
      .select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/shortlists/:id ───────────────────────────────
router.delete("/:id", async (req, res) => {
  const userId = req.user.id;
  try {
    await supabase
      .from("candidate_shortlists")
      .delete()
      .eq("id", req.params.id)
      .eq("recruiter_id", userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/shortlists/:id/candidates ──────────────────────
router.get("/:id/candidates", async (req, res) => {
  const userId = req.user.id;
  try {
    const { data: list } = await supabase
      .from("candidate_shortlists")
      .select("id")
      .eq("id", req.params.id)
      .eq("recruiter_id", userId)
      .single();
    if (!list) return res.status(404).json({ error: "Shortlist not found" });

    const { data, error } = await supabase
      .from("shortlist_candidates")
      .select("*, candidate:profiles(id, full_name, email, plan, created_at)")
      .eq("shortlist_id", req.params.id)
      .order("added_at", { ascending: false });
    if (error) throw error;
    res.json({ candidates: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/shortlists/:id/candidates ─────────────────────
router.post("/:id/candidates", async (req, res) => {
  const userId = req.user.id;
  const { candidateId, note, rating } = req.body;
  if (!candidateId) return res.status(400).json({ error: "candidateId required" });

  try {
    const { data: list } = await supabase
      .from("candidate_shortlists")
      .select("id")
      .eq("id", req.params.id)
      .eq("recruiter_id", userId)
      .single();
    if (!list) return res.status(404).json({ error: "Shortlist not found" });

    const { data, error } = await supabase
      .from("shortlist_candidates")
      .upsert({ shortlist_id: req.params.id, candidate_id: candidateId, note, rating }, { onConflict: "shortlist_id,candidate_id" })
      .select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/shortlists/:id/candidates/:candidateId ──────
router.delete("/:id/candidates/:candidateId", async (req, res) => {
  const userId = req.user.id;
  try {
    const { data: list } = await supabase
      .from("candidate_shortlists")
      .select("id")
      .eq("id", req.params.id)
      .eq("recruiter_id", userId)
      .single();
    if (!list) return res.status(404).json({ error: "Shortlist not found" });

    await supabase
      .from("shortlist_candidates")
      .delete()
      .eq("shortlist_id", req.params.id)
      .eq("candidate_id", req.params.candidateId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
