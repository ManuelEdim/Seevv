import express from "express";
import { supabase } from "../lib/supabase.js";
import auth from "../middleware/auth.js";
import { extractCVClaims } from "../lib/ai.js";

const router = express.Router();
router.use(auth);

// POST /api/proof-of-work/extract
// Extract claims from the user's active CV that need proof
router.post("/extract", async (req, res) => {
  const userId = req.user.id;

  try {
    const { data: cv, error: cvErr } = await supabase
      .from("cvs")
      .select("raw_text")
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (cvErr || !cv) return res.status(404).json({ error: "No active CV found. Please upload your CV first." });

    const result = await extractCVClaims(cv.raw_text);
    res.json(result);
  } catch (err) {
    console.error("Proof-of-work extract error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/proof-of-work
// Get all evidence items for the user
router.get("/", async (req, res) => {
  const userId = req.user.id;

  try {
    const { data, error } = await supabase
      .from("cv_evidence")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error("Get evidence error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/proof-of-work
// Save an evidence item (proof for a claim)
router.post("/", async (req, res) => {
  const userId = req.user.id;
  const { claim, proof_type, proof_url, proof_notes } = req.body;

  if (!claim) return res.status(400).json({ error: "claim required" });

  try {
    const { data, error } = await supabase
      .from("cv_evidence")
      .insert({ user_id: userId, claim, proof_type, proof_url, proof_notes })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Save evidence error:", err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/proof-of-work/:id
// Update an evidence item
router.patch("/:id", async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { proof_type, proof_url, proof_notes } = req.body;

  try {
    const { data, error } = await supabase
      .from("cv_evidence")
      .update({ proof_type, proof_url, proof_notes })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Update evidence error:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/proof-of-work/:id
router.delete("/:id", async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from("cv_evidence")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    console.error("Delete evidence error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
