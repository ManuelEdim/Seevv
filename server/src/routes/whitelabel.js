import { Router } from "express";
import auth from "../middleware/auth.js";
import adminOnly from "../middleware/admin.js";
import { supabase } from "../lib/supabase.js";

const router = Router();
router.use(auth);
router.use(adminOnly);

const WL_KEYS = [
  "whitelabel_enabled",
  "whitelabel_company_name",
  "whitelabel_logo_url",
  "whitelabel_primary_color",
  "whitelabel_support_email",
  "whitelabel_domain",
];

// GET /api/whitelabel — return all whitelabel settings
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", WL_KEYS);
    if (error) throw error;
    const settings = Object.fromEntries((data || []).map((r) => [r.key, r.value]));
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/whitelabel — upsert settings
router.patch("/", async (req, res) => {
  const updates = req.body;
  const rows = Object.entries(updates)
    .filter(([k]) => WL_KEYS.includes(k))
    .map(([key, value]) => ({ key, value: String(value) }));

  if (!rows.length) return res.status(400).json({ error: "No valid keys provided" });

  try {
    const { error } = await supabase
      .from("app_settings")
      .upsert(rows, { onConflict: "key" });
    if (error) throw error;
    res.json({ success: true, updated: rows.map((r) => r.key) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
