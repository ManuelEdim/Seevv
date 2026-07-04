import { Router } from "express";
import authMiddleware from "../middleware/auth.js";
import { supabase } from "../lib/supabase.js";

const router = Router();
router.use(authMiddleware);

// GET /api/search?q=&limit=20
router.get("/", async (req, res) => {
  const { q = "", limit = 20 } = req.query;
  const userId = req.user.id;
  const term = q.trim();

  if (!term || term.length < 2) return res.json({ results: [] });

  const ilike = `%${term}%`;

  try {
    const [jobsRes, cvsRes, lettersRes, trackerRes] = await Promise.allSettled([
      supabase
        .from("job_targets")
        .select("id, job_title, company_name, created_at")
        .eq("user_id", userId)
        .or(`job_title.ilike.${ilike},company_name.ilike.${ilike}`)
        .order("created_at", { ascending: false })
        .limit(5),

      supabase
        .from("cvs")
        .select("id, file_name, created_at")
        .eq("user_id", userId)
        .ilike("file_name", ilike)
        .limit(3),

      supabase
        .from("cover_letters")
        .select("id, created_at, job_target:job_targets(job_title, company_name)")
        .eq("user_id", userId)
        .limit(3),

      supabase
        .from("job_targets")
        .select("id, job_title, company_name, status, created_at")
        .eq("user_id", userId)
        .not("status", "is", null)
        .or(`job_title.ilike.${ilike},company_name.ilike.${ilike}`)
        .limit(4),
    ]);

    const results = [];

    (jobsRes.value?.data || []).forEach((j) =>
      results.push({ type: "job_target", id: j.id, title: j.job_title, sub: j.company_name, path: `/decoder?jobId=${j.id}`, date: j.created_at })
    );
    (cvsRes.value?.data || []).forEach((c) =>
      results.push({ type: "cv", id: c.id, title: c.file_name, sub: "Master CV", path: `/cv`, date: c.created_at })
    );
    (lettersRes.value?.data || [])
      .filter((l) => {
        const t = `${l.job_target?.job_title || ""} ${l.job_target?.company_name || ""}`.toLowerCase();
        return t.includes(term.toLowerCase());
      })
      .forEach((l) =>
        results.push({ type: "cover_letter", id: l.id, title: `Cover Letter — ${l.job_target?.job_title || ""}`, sub: l.job_target?.company_name, path: `/cover-letter`, date: l.created_at })
      );
    (trackerRes.value?.data || []).forEach((t) =>
      results.push({ type: "tracker", id: t.id, title: t.job_title, sub: `${t.company_name} · ${t.status}`, path: `/tracker`, date: t.created_at })
    );

    // Sort by recency, deduplicate by id+type
    const seen = new Set();
    const deduped = results
      .filter((r) => { const k = `${r.type}:${r.id}`; if (seen.has(k)) return false; seen.add(k); return true; })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, Number(limit));

    res.json({ results: deduped });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
