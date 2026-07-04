import { Router } from "express";
import authMiddleware from "../middleware/auth.js";
import { supabase } from "../lib/supabase.js";
import crypto from "crypto";

const router = Router();
router.use(authMiddleware);

// ─── GET /api/webhooks ────────────────────────────────────
router.get("/", async (req, res) => {
  const userId = req.user.id;
  try {
    const { data, error } = await supabase
      .from("user_webhooks")
      .select("id, url, events, active, last_triggered_at, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ webhooks: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/webhooks — create ──────────────────────────
router.post("/", async (req, res) => {
  const userId = req.user.id;
  const { url, events } = req.body;
  if (!url || !events?.length) return res.status(400).json({ error: "url and events required" });

  const VALID_EVENTS = [
    "cv.updated", "cv_version.created", "job.applied", "job.status_changed",
    "interview.scheduled", "verification.approved", "verification.rejected",
  ];
  const invalid = events.filter((e) => !VALID_EVENTS.includes(e));
  if (invalid.length) return res.status(400).json({ error: `Invalid events: ${invalid.join(", ")}` });

  try {
    // Generate a signing secret
    const secret = `whsec_${crypto.randomBytes(24).toString("base64url")}`;

    const { data, error } = await supabase
      .from("user_webhooks")
      .insert({ user_id: userId, url, events, secret })
      .select()
      .single();
    if (error) throw error;

    // Return secret only on creation — never shown again
    res.json({ ...data, secret });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/webhooks/:id ──────────────────────────────
router.patch("/:id", async (req, res) => {
  const userId = req.user.id;
  const { url, events, active } = req.body;
  try {
    const updates = {};
    if (url !== undefined) updates.url = url;
    if (events !== undefined) updates.events = events;
    if (active !== undefined) updates.active = active;

    const { data, error } = await supabase
      .from("user_webhooks")
      .update(updates)
      .eq("id", req.params.id)
      .eq("user_id", userId)
      .select("id, url, events, active, last_triggered_at, created_at")
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/webhooks/:id ─────────────────────────────
router.delete("/:id", async (req, res) => {
  const userId = req.user.id;
  try {
    await supabase.from("user_webhooks").delete().eq("id", req.params.id).eq("user_id", userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/webhooks/:id/test ──────────────────────────
router.post("/:id/test", async (req, res) => {
  const userId = req.user.id;
  try {
    const { data: webhook } = await supabase
      .from("user_webhooks")
      .select("*")
      .eq("id", req.params.id)
      .eq("user_id", userId)
      .single();

    if (!webhook) return res.status(404).json({ error: "Webhook not found" });

    const payload = { event: "test.ping", timestamp: new Date().toISOString(), data: { message: "Webhook test from Seevv" } };
    const body = JSON.stringify(payload);
    const sig = crypto.createHmac("sha256", webhook.secret).update(body).digest("hex");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Seevv-Signature": `sha256=${sig}`, "X-Seevv-Event": "test.ping" },
        body,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      await supabase.from("webhook_deliveries").insert({
        webhook_id: webhook.id,
        event: "test.ping",
        payload,
        status_code: response.status,
        success: response.ok,
      });

      res.json({ success: response.ok, statusCode: response.status });
    } catch (fetchErr) {
      clearTimeout(timeout);
      await supabase.from("webhook_deliveries").insert({
        webhook_id: webhook.id,
        event: "test.ping",
        payload,
        success: false,
        error_message: fetchErr.message,
      });
      res.status(502).json({ success: false, error: fetchErr.message });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/webhooks/:id/deliveries ────────────────────
router.get("/:id/deliveries", async (req, res) => {
  const userId = req.user.id;
  try {
    const { data: webhook } = await supabase
      .from("user_webhooks")
      .select("id")
      .eq("id", req.params.id)
      .eq("user_id", userId)
      .single();

    if (!webhook) return res.status(404).json({ error: "Webhook not found" });

    const { data, error } = await supabase
      .from("webhook_deliveries")
      .select("id, event, status_code, success, error_message, created_at")
      .eq("webhook_id", req.params.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    res.json({ deliveries: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
