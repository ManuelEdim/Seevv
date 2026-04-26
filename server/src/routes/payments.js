import express from "express";
import { supabase } from "../lib/supabase.js";
import auth from "../middleware/auth.js";

const router = express.Router();
router.use(auth);

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE = "https://api.paystack.co";

const paystackFetch = (path, options = {}) =>
  fetch(`${PAYSTACK_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  }).then((r) => r.json());

// Plan definitions — amounts in smallest unit (kobo for NGN, cents for USD/GBP)
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
// Initialize a Paystack transaction and return the hosted payment URL
router.post("/initialize", async (req, res) => {
  const { planKey } = req.body;
  const userId = req.user.id;

  const plan = PLANS[planKey];
  if (!plan) return res.status(400).json({ error: "Invalid plan key" });
  if (!PAYSTACK_SECRET) return res.status(500).json({ error: "Payment gateway not configured" });

  try {
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", userId)
      .single();

    if (profileErr || !profile) return res.status(404).json({ error: "User profile not found" });

    const reference = `seevv_${userId.slice(0, 8)}_${Date.now()}`;

    const payload = {
      email: profile.email,
      amount: plan.amount,
      currency: plan.currency,
      reference,
      metadata: {
        user_id: userId,
        plan_key: planKey,
        plan_name: plan.name,
        full_name: profile.full_name || "",
      },
    };

    const result = await paystackFetch("/transaction/initialize", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!result.status) {
      return res.status(502).json({ error: result.message || "Failed to initialize payment" });
    }

    res.json({
      authorization_url: result.data.authorization_url,
      access_code: result.data.access_code,
      reference: result.data.reference,
    });
  } catch (err) {
    console.error("Payment initialize error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/payments/verify/:reference
// Verify a completed Paystack transaction and upgrade the user's plan
router.get("/verify/:reference", async (req, res) => {
  const { reference } = req.params;
  const userId = req.user.id;

  if (!PAYSTACK_SECRET) return res.status(500).json({ error: "Payment gateway not configured" });

  try {
    const result = await paystackFetch(`/transaction/verify/${reference}`);

    if (!result.status || result.data?.status !== "success") {
      return res.status(402).json({ error: "Payment not successful", detail: result.data?.gateway_response });
    }

    const meta = result.data.metadata || {};

    // Guard: only update if the reference belongs to this user
    if (meta.user_id && meta.user_id !== userId) {
      return res.status(403).json({ error: "Reference does not belong to this account" });
    }

    const planKey = meta.plan_key || "";
    const planName = PLANS[planKey]?.plan || "pro";

    // Upgrade the user's plan in Supabase
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
      amount: result.data.amount,
      currency: result.data.currency,
      paid_at: result.data.paid_at,
    });
  } catch (err) {
    console.error("Payment verify error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
