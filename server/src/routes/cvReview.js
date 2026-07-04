import { Router } from "express";
import authMiddleware from "../middleware/auth.js";
import { supabase } from "../lib/supabase.js";

const router = Router();

// ─── POST /api/cv-review/share — create share token ──────
// Auth required: user creates a share link for their CV
router.post("/share", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { cvId, title, expiresIn } = req.body; // expiresIn: days (null = no expiry)

  try {
    const { data: cv } = await supabase
      .from("cvs")
      .select("id, file_name, raw_text")
      .eq("id", cvId)
      .eq("user_id", userId)
      .single();

    if (!cv) return res.status(404).json({ error: "CV not found" });

    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 86400_000).toISOString()
      : null;

    const { data, error } = await supabase
      .from("cv_shares")
      .insert({
        user_id: userId,
        cv_id: cvId,
        title: title || cv.file_name || "My CV",
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) throw error;

    const shareUrl = `${process.env.FRONTEND_URL || "https://seevv.io"}/review/${data.token}`;
    res.json({ share: data, url: shareUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/cv-review/my — list user's shares ───────────
router.get("/my", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const { data, error } = await supabase
      .from("cv_shares")
      .select("*, comments:cv_share_comments(count)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ shares: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/cv-review/:id — revoke share ────────────
router.delete("/:id", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    await supabase
      .from("cv_shares")
      .update({ active: false })
      .eq("id", req.params.id)
      .eq("user_id", userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/cv-review/public/:token — PUBLIC ───────────
// No auth: anyone with the token can read the CV
router.get("/public/:token", async (req, res) => {
  try {
    const { data: share, error } = await supabase
      .from("cv_shares")
      .select("*, cv:cvs(file_name, raw_text), owner:profiles(full_name)")
      .eq("token", req.params.token)
      .eq("active", true)
      .single();

    if (error || !share) return res.status(404).json({ error: "Share not found or revoked" });

    if (share.expires_at && new Date(share.expires_at) < new Date())
      return res.status(410).json({ error: "This share link has expired" });

    // Increment view count
    await supabase
      .from("cv_shares")
      .update({ view_count: (share.view_count || 0) + 1 })
      .eq("id", share.id);

    const { data: comments } = await supabase
      .from("cv_share_comments")
      .select("id, reviewer_name, content, created_at")
      .eq("share_id", share.id)
      .order("created_at", { ascending: true });

    res.json({
      id: share.id,
      title: share.title,
      ownerName: share.owner?.full_name || "Anonymous",
      fileName: share.cv?.file_name,
      rawText: share.cv?.raw_text,
      viewCount: (share.view_count || 0) + 1,
      comments: comments || [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/cv-review/public/:token/comment — PUBLIC ──
router.post("/public/:token/comment", async (req, res) => {
  const { reviewerName, content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: "content required" });

  try {
    const { data: share } = await supabase
      .from("cv_shares")
      .select("id, active, expires_at")
      .eq("token", req.params.token)
      .single();

    if (!share?.active) return res.status(404).json({ error: "Share not found" });
    if (share.expires_at && new Date(share.expires_at) < new Date())
      return res.status(410).json({ error: "Share link has expired" });

    const { data, error } = await supabase
      .from("cv_share_comments")
      .insert({
        share_id: share.id,
        reviewer_name: reviewerName?.trim() || "Anonymous",
        content: content.trim(),
      })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
