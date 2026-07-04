import express from "express";
import { supabase } from "../lib/supabase.js";
import auth from "../middleware/auth.js";
import { getPaymentProvider, isPaymentEnabled } from "../lib/paymentProvider.js";

const router = express.Router();
router.use(auth);

// Plan definitions — amounts in smallest currency unit (kobo/cents/pence)
const PLANS = {
  starter_ngn:  { amount: 400000,  currency: "NGN", name: "Starter Plan", plan: "starter" },
  starter_usd:  { amount: 900,     currency: "USD", name: "Starter Plan", plan: "starter" },
  starter_gbp:  { amount: 700,     currency: "GBP", name: "Starter Plan", plan: "starter" },
  pro_ngn:      { amount: 900000,  currency: "NGN", name: "Pro Plan",     plan: "pro"     },
  pro_usd:      { amount: 1900,    currency: "USD", name: "Pro Plan",     plan: "pro"     },
  pro_gbp:      { amount: 1500,    currency: "GBP", name: "Pro Plan",     plan: "pro"     },
  pro_plus_ngn: { amount: 1800000, currency: "NGN", name: "Pro+ Plan",    plan: "pro_plus"},
  pro_plus_usd: { amount: 3900,    currency: "USD", name: "Pro+ Plan",    plan: "pro_plus"},
  pro_plus_gbp: { amount: 2900,    currency: "GBP", name: "Pro+ Plan",    plan: "pro_plus"},
};

// POST /api/payments/initialize
router.post("/initialize", async (req, res) => {
  const { planKey, callbackUrl, cancelUrl } = req.body;
  const userId = req.user.id;

  const plan = PLANS[planKey];
  if (!plan) return res.status(400).json({ error: "Invalid plan key" });

  try {
    const enabled = await isPaymentEnabled();
    if (!enabled) return res.status(503).json({ error: "Payments are currently disabled." });

    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", userId)
      .single();

    if (profileErr || !profile) return res.status(404).json({ error: "User profile not found" });

    const reference = `seevv_${userId.slice(0, 8)}_${Date.now()}`;
    const provider = await getPaymentProvider();

    const result = await provider.initialize({
      email: profile.email,
      name: profile.full_name || "",
      amount: plan.amount,
      currency: plan.currency,
      reference,
      metadata: {
        user_id: userId,
        plan_key: planKey,
        plan_name: plan.name,
        full_name: profile.full_name || "",
      },
      callbackUrl: callbackUrl || `${process.env.FRONTEND_URL || "http://localhost:5173"}/pricing`,
      cancelUrl: cancelUrl || `${process.env.FRONTEND_URL || "http://localhost:5173"}/pricing`,
    });

    res.json(result);
  } catch (err) {
    console.error("Payment initialize error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/payments/verify/:reference
router.get("/verify/:reference", async (req, res) => {
  const { reference } = req.params;
  const userId = req.user.id;

  try {
    const enabled = await isPaymentEnabled();
    if (!enabled) return res.status(503).json({ error: "Payments are currently disabled." });

    const provider = await getPaymentProvider();
    const result = await provider.verify(reference);

    // Guard: only upgrade if the metadata user_id matches the authed user
    const meta = result.metadata || {};
    if (meta.user_id && meta.user_id !== userId) {
      return res.status(403).json({ error: "Reference does not belong to this account" });
    }

    const planKey = meta.plan_key || "";
    const planName = PLANS[planKey]?.plan || "pro";

    const { error: updateErr } = await supabase
      .from("profiles")
      .update({
        plan: planName,
        plan_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        paystack_reference: reference,
      })
      .eq("id", userId);

    if (updateErr) {
      console.error("Plan upgrade DB error:", updateErr);
      return res.status(500).json({ error: "Payment verified but plan upgrade failed. Contact support." });
    }

    res.json({
      success: true,
      plan: planName,
      amount: result.amount,
      currency: result.currency,
      paid_at: result.paid_at,
    });
  } catch (err) {
    console.error("Payment verify error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
