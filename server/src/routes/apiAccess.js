import { Router } from "express";
import { randomBytes } from "crypto";
import authMiddleware from "../middleware/auth.js";
import { supabase } from "../lib/supabase.js";

const router = Router();
router.use(authMiddleware);

const generateKey = () => `seevv_${randomBytes(24).toString("hex")}`;

// GET /api/api-access
router.get("/", async (req, res) => {
  try {
    const { data } = await supabase
      .from("profiles")
      .select("api_key, api_key_created_at")
      .eq("id", req.user.id)
      .single();
    // Graceful if columns don't exist yet — data would be null
    res.json({
      hasKey: !!data?.api_key,
      keyPreview: data?.api_key ? `${data.api_key.slice(0, 14)}••••••••••••••••` : null,
      createdAt: data?.api_key_created_at || null,
    });
  } catch (err) {
    res.json({ hasKey: false, keyPreview: null, createdAt: null });
  }
});

// POST /api/api-access/generate — create or rotate key
router.post("/generate", async (req, res) => {
  const key = generateKey();
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ api_key: key, api_key_created_at: new Date().toISOString() })
      .eq("id", req.user.id);
    if (error) throw error;
    // Return the full key ONCE — never shown again after this request
    res.json({ key, createdAt: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/api-access — revoke key
router.delete("/", async (req, res) => {
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ api_key: null, api_key_created_at: null })
      .eq("id", req.user.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
