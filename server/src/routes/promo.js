import { Router } from "express";
import authMiddleware from "../middleware/auth.js";
import adminOnly from "../middleware/admin.js";
import { supabase } from "../lib/supabase.js";
import { logAudit } from "../lib/audit.js";

const router = Router();
router.use(authMiddleware);

// ─── POST /api/promo/validate — validate + preview discount ──
router.post("/validate", async (req, res) => {
  const { code, plan } = req.body;
  if (!code) return res.status(400).json({ error: "code required" });

  try {
    const { data: promo, error } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("code", code.toUpperCase().trim())
      .eq("active", true)
      .maybeSingle();

    if (error || !promo) return res.status(404).json({ error: "Invalid or expired promo code" });

    const now = new Date();
    if (promo.valid_from && new Date(promo.valid_from) > now)
      return res.status(400).json({ error: "Promo code not yet active" });
    if (promo.valid_until && new Date(promo.valid_until) < now)
      return res.status(400).json({ error: "Promo code has expired" });
    if (promo.max_uses !== null && promo.used_count >= promo.max_uses)
      return res.status(400).json({ error: "Promo code has reached its usage limit" });
    if (promo.applies_to && plan && promo.applies_to !== plan)
      return res.status(400).json({ error: `This code only applies to the ${promo.applies_to} plan` });

    // Check if this user already used it
    const { data: existing } = await supabase
      .from("promo_redemptions")
      .select("id")
      .eq("code_id", promo.id)
      .eq("user_id", req.user.id)
      .maybeSingle();

    if (existing) return res.status(400).json({ error: "You've already used this promo code" });

    res.json({
      valid: true,
      codeId: promo.id,
      discountType: promo.discount_type,
      discountValue: promo.discount_value,
      description: promo.description,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/promo/redeem — record redemption ───────────────
router.post("/redeem", async (req, res) => {
  const { codeId, plan, amountOff } = req.body;
  if (!codeId) return res.status(400).json({ error: "codeId required" });

  try {
    await supabase.from("promo_redemptions").insert({
      code_id: codeId,
      user_id: req.user.id,
      plan,
      amount_off: amountOff,
    });

    // Increment used_count
    await supabase.rpc("increment_promo_count", { promo_id: codeId });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: CRUD promo codes ──────────────────────────────────
router.get("/admin", adminOnly, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("promo_codes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ codes: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/admin", adminOnly, async (req, res) => {
  const { code, description, discount_type, discount_value, applies_to, max_uses, valid_from, valid_until } = req.body;
  if (!code || !discount_type || !discount_value) return res.status(400).json({ error: "code, discount_type, discount_value required" });

  try {
    const { data, error } = await supabase.from("promo_codes").insert({
      code: code.toUpperCase().trim(),
      description,
      discount_type,
      discount_value,
      applies_to: applies_to || null,
      max_uses: max_uses || null,
      valid_from: valid_from || null,
      valid_until: valid_until || null,
      created_by: req.user.id,
    }).select().single();

    if (error) throw error;

    await logAudit(req.user.id, "promo.created", "promo_code", data.id, { code: data.code });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/admin/:id", adminOnly, async (req, res) => {
  const { active, valid_until, max_uses } = req.body;
  try {
    const { data, error } = await supabase
      .from("promo_codes")
      .update({ active, valid_until, max_uses })
      .eq("id", req.params.id)
      .select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/admin/:id", adminOnly, async (req, res) => {
  try {
    await supabase.from("promo_codes").update({ active: false }).eq("id", req.params.id);
    await logAudit(req.user.id, "promo.deactivated", "promo_code", req.params.id, {});
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
