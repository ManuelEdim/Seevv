import { Router } from "express";
import authMiddleware from "../middleware/auth.js";
import { supabase } from "../lib/supabase.js";

const router = Router();
router.use(authMiddleware);

const DEFAULT_BRANDING = {
  accentColor: "#033876",
  fontStyle: "professional",
  showLogo: false,
  logoUrl: null,
  headerStyle: "classic",
};

// GET /api/branding
router.get("/", async (req, res) => {
  try {
    const { data } = await supabase
      .from("profiles")
      .select("branding")
      .eq("id", req.user.id)
      .single();
    // If column doesn't exist yet, data?.branding is undefined — merge with defaults
    res.json({ branding: { ...DEFAULT_BRANDING, ...(data?.branding || {}) } });
  } catch (err) {
    res.json({ branding: DEFAULT_BRANDING });
  }
});

// PATCH /api/branding
router.patch("/", async (req, res) => {
  const { accentColor, fontStyle, headerStyle, showLogo } = req.body;
  const updates = {};

  if (accentColor !== undefined) {
    if (!/^#[0-9A-Fa-f]{6}$/.test(accentColor))
      return res.status(400).json({ error: "Invalid hex color" });
    updates.accentColor = accentColor;
  }
  if (fontStyle !== undefined) updates.fontStyle = fontStyle;
  if (headerStyle !== undefined) updates.headerStyle = headerStyle;
  if (showLogo !== undefined) updates.showLogo = Boolean(showLogo);

  try {
    // Merge with existing branding
    const { data: existing } = await supabase
      .from("profiles")
      .select("branding")
      .eq("id", req.user.id)
      .single();

    const merged = { ...DEFAULT_BRANDING, ...(existing?.branding || {}), ...updates };

    const { data, error } = await supabase
      .from("profiles")
      .update({ branding: merged })
      .eq("id", req.user.id)
      .select("branding")
      .single();

    if (error) throw error;
    res.json({ branding: data.branding });
  } catch (err) {
    const msg = err.message?.includes("column") || err.message?.includes("does not exist")
      ? "Database migration required. Run: ALTER TABLE profiles ADD COLUMN IF NOT EXISTS branding JSONB DEFAULT '{}';"
      : err.message;
    res.status(500).json({ error: msg });
  }
});

// GET /api/branding/reset
router.post("/reset", async (req, res) => {
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ branding: DEFAULT_BRANDING })
      .eq("id", req.user.id);
    if (error) throw error;
    res.json({ branding: DEFAULT_BRANDING });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
