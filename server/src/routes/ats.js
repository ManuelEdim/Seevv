import { Router } from "express";
import auth from "../middleware/auth.js";
import adminOnly from "../middleware/admin.js";
import { supabase } from "../lib/supabase.js";

const router = Router();
router.use(auth);
router.use(adminOnly);

const PROVIDERS = ["greenhouse", "lever", "workday", "ashby", "teamtailor"];

// GET /api/ats — list configured integrations
router.get("/", async (req, res) => {
  try {
    const keys = PROVIDERS.map((p) => `ats_${p}_enabled`);
    const { data, error } = await supabase
      .from("app_settings")
      .select("key, value")
      .like("key", "ats_%");
    if (error) throw error;

    const raw = Object.fromEntries((data || []).map((r) => [r.key, r.value]));
    const integrations = PROVIDERS.map((p) => ({
      provider: p,
      enabled: raw[`ats_${p}_enabled`] === "true",
      apiKey: raw[`ats_${p}_api_key`] ? "••••••••" : null,
      webhookUrl: raw[`ats_${p}_webhook_url`] || null,
    }));
    res.json({ integrations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/ats/:provider — configure a provider
router.patch("/:provider", async (req, res) => {
  const { provider } = req.params;
  if (!PROVIDERS.includes(provider)) return res.status(400).json({ error: "Unknown provider" });

  const { enabled, apiKey, webhookUrl } = req.body;
  const rows = [];

  if (enabled !== undefined) rows.push({ key: `ats_${provider}_enabled`, value: String(enabled) });
  if (apiKey !== undefined && apiKey !== null) rows.push({ key: `ats_${provider}_api_key`, value: apiKey });
  if (webhookUrl !== undefined) rows.push({ key: `ats_${provider}_webhook_url`, value: webhookUrl || "" });

  if (!rows.length) return res.status(400).json({ error: "Nothing to update" });

  try {
    const { error } = await supabase.from("app_settings").upsert(rows, { onConflict: "key" });
    if (error) throw error;
    res.json({ success: true, provider });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ats/:provider/test — stub connection test
router.post("/:provider/test", async (req, res) => {
  const { provider } = req.params;
  if (!PROVIDERS.includes(provider)) return res.status(400).json({ error: "Unknown provider" });

  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", `ats_${provider}_api_key`)
    .single();

  if (!data?.value) {
    return res.status(400).json({ success: false, message: "No API key configured" });
  }
  // Stub: actual test would call the ATS API
  res.json({ success: true, message: `${provider} connection test passed (stub)` });
});

export default router;
