import { Router } from "express";
import authMiddleware from "../middleware/auth.js";
import adminOnly from "../middleware/admin.js";
import { exportCVAsPdf } from "../controllers/exportController.js";
import { generateCoverLetterPdf, generateProofOfWorkPdf } from "../lib/pdfGenerator.js";
import { generateCVDocx } from "../lib/docxGenerator.js";
import { supabase } from "../lib/supabase.js";

const router = Router();
router.use(authMiddleware);

// ─── CV PDF (existing) ─────────────────────────────────────
router.post("/cv/pdf", exportCVAsPdf);

// ─── Cover Letter PDF ──────────────────────────────────────
router.post("/cover-letter/pdf", async (req, res) => {
  const { letterId } = req.body;
  const userId = req.user.id;

  try {
    const { data: letter, error } = await supabase
      .from("cover_letters")
      .select("*, job_target:job_targets(job_title, company_name)")
      .eq("id", letterId)
      .eq("user_id", userId)
      .single();

    if (error || !letter) return res.status(404).json({ error: "Cover letter not found" });

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();

    const pdfBuffer = await generateCoverLetterPdf({
      fullName:  profile?.full_name || "",
      jobTitle:  letter.job_target?.job_title  || "",
      company:   letter.job_target?.company_name || "",
      tone:      letter.tone    || "formal",
      content:   letter.content || "",
    });

    const safeName = (profile?.full_name || "Cover Letter").replace(/[^a-z0-9 ]/gi, "");
    const safeJob  = (letter.job_target?.job_title || "Role").replace(/[^a-z0-9 ]/gi, "");

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName} - ${safeJob} Cover Letter.pdf"`,
      "Content-Length": pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Cover letter PDF error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Proof of Work PDF ─────────────────────────────────────
router.post("/proof-of-work/pdf", async (req, res) => {
  const userId = req.user.id;
  try {
    const [{ data: evidence }, { data: profile }] = await Promise.all([
      supabase.from("proof_of_work").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("profiles").select("full_name").eq("id", userId).single(),
    ]);

    const pdfBuffer = await generateProofOfWorkPdf({
      fullName: profile?.full_name || "",
      evidence: evidence || [],
    });

    const safeName = (profile?.full_name || "Evidence").replace(/[^a-z0-9 ]/gi, "");
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName} - Proof of Work.pdf"`,
      "Content-Length": pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Proof of work PDF error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── CV DOCX ──────────────────────────────────────────────
router.post("/cv/docx", async (req, res) => {
  const { versionId } = req.body;
  const userId = req.user.id;

  try {
    const { data: version, error: vErr } = await supabase
      .from("cv_versions")
      .select("*, job_target:job_targets(job_title, company_name)")
      .eq("id", versionId)
      .eq("user_id", userId)
      .single();

    if (vErr || !version) return res.status(404).json({ error: "CV version not found." });

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();

    const tc = version.tailored_content || {};

    const resolveBullets = (section) => {
      if (!section) return [];
      const decisions = section.bullet_decisions || {};
      const tailored = section.bullets_tailored || [];
      const original = section.bullets_original || tailored;
      return tailored
        .map((b, i) => (decisions[i] === false ? original[i] || b : b))
        .filter((b) => b && b.trim().length > 5);
    };

    const summary = (() => {
      const s = tc.summary;
      if (!s) return "";
      if (s.accepted === true) return (s.tailored || s.original || "").trim();
      const bullets = resolveBullets(s);
      return bullets.join(" ").trim() || (s.tailored || s.original || "").trim();
    })();

    const experience = (() => {
      const exp = tc.experience;
      if (!exp) return [];
      const roles = exp.roles_tailored || exp.roles_original || [];
      if (roles.length > 0) {
        return roles.map((role) => {
          const decisions = role.bullet_decisions || {};
          const tailored = role.bullets || [];
          const original = role.bullets_original || tailored;
          return {
            title: role.title || "",
            company: role.company || "",
            period: role.period || "",
            bullets: tailored
              .map((b, i) => (decisions[i] === false ? original[i] || b : b))
              .filter((b) => b && b.trim().length > 5),
          };
        }).filter((r) => r.bullets.length > 0);
      }
      const bullets = resolveBullets(exp);
      return bullets.length > 0 ? [{ title: "Experience", company: "", period: "", bullets }] : [];
    })();

    const skills = resolveBullets(tc.skills).length > 0
      ? resolveBullets(tc.skills)
      : (tc.skills?.tailored || tc.skills?.original || "")
          .split("\n").map((l) => l.replace(/^[-•·▪▸►*○●✓\d+.)\s]+/, "").trim()).filter((l) => l.length > 3);

    const parseText = (section) => {
      const text = section?.tailored || section?.original || "";
      return text.split("\n").map((l) => l.replace(/^[-•·▪▸►*○●✓\d+.)\s]+/, "").trim()).filter((l) => l.length > 5);
    };

    const contactInfo = Array.isArray(tc.contact_info) ? tc.contact_info[0] || "" : "";

    const docxBuffer = await generateCVDocx({
      fullName: profile?.full_name || "Your Name",
      contactInfo,
      summary,
      experience,
      skills,
      education: parseText(tc.education),
      achievements: resolveBullets(tc.achievements).length > 0 ? resolveBullets(tc.achievements) : parseText(tc.achievements),
      projects: resolveBullets(tc.projects).length > 0 ? resolveBullets(tc.projects) : parseText(tc.projects),
    });

    const jobTitle = (version.job_target?.job_title || "Tailored CV").replace(/\s+/g, " ").trim();
    const company = (version.job_target?.company_name || "").trim();
    const jobPart = company ? `${jobTitle} (${company})` : jobTitle;
    const userName = (profile?.full_name || "").trim();
    const fileName = `${jobPart}${userName ? ` - ${userName}` : ""}.docx`;

    res.set({
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Length": docxBuffer.length,
    });
    res.send(docxBuffer);
  } catch (err) {
    console.error("DOCX export error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: download any user's CV ────────────────────────
router.post("/admin/cv/:versionId", adminOnly, async (req, res) => {
  const { versionId } = req.params;
  try {
    const { data: version, error: vErr } = await supabase
      .from("cv_versions")
      .select("*, job_target:job_targets(job_title, company_name), cv:cvs(file_name)")
      .eq("id", versionId)
      .single();

    if (vErr || !version) return res.status(404).json({ error: "CV version not found" });

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", version.user_id)
      .single();

    // Re-use exportCVAsPdf logic with admin-fetched data
    req.body.versionId = versionId;
    req.user.id = version.user_id; // spoof user_id so exportCVAsPdf finds the right record
    return exportCVAsPdf(req, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: download any user's cover letter ──────────────
router.post("/admin/cover-letter/:letterId", adminOnly, async (req, res) => {
  const { letterId } = req.params;
  try {
    const { data: letter, error } = await supabase
      .from("cover_letters")
      .select("*, job_target:job_targets(job_title, company_name)")
      .eq("id", letterId)
      .single();

    if (error || !letter) return res.status(404).json({ error: "Cover letter not found" });

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", letter.user_id)
      .single();

    const pdfBuffer = await generateCoverLetterPdf({
      fullName: profile?.full_name || "",
      jobTitle: letter.job_target?.job_title || "",
      company:  letter.job_target?.company_name || "",
      tone:     letter.tone || "formal",
      content:  letter.content || "",
    });

    const safeName = (profile?.full_name || "Cover Letter").replace(/[^a-z0-9 ]/gi, "");
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName} - Cover Letter.pdf"`,
      "Content-Length": pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
