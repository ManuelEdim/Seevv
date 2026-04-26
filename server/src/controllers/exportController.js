import { generateCVPdf } from "../lib/pdfGenerator.js";
import { supabase } from "../lib/supabase.js";

export const exportCVAsPdf = async (req, res) => {
  const { versionId } = req.body;
  const userId = req.user.id;

  try {
    const { data: version, error: versionError } = await supabase
      .from("cv_versions")
      .select(
        `
        *,
        job_target:job_targets(job_title, company_name),
        cv:cvs(file_name)
      `,
      )
      .eq("id", versionId)
      .eq("user_id", userId)
      .single();

    if (versionError || !version) {
      return res.status(404).json({ error: "CV version not found." });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, branding")
      .eq("id", userId)
      .single();

    const tc = version.tailored_content || {};

    // ── Summary ───────────────────────────────────────
    const summary = (() => {
      const s = tc.summary;
      if (!s) return "";

      if (s.accepted === true) {
        return (s.tailored || s.original || "").trim();
      }

      const decisions = s.bullet_decisions || {};
      const tailoredBullets =
        Array.isArray(s.bullets_tailored) && s.bullets_tailored.length > 0
          ? s.bullets_tailored
          : [s.tailored].filter(Boolean);
      const originalBullets =
        Array.isArray(s.bullets_original) && s.bullets_original.length > 0
          ? s.bullets_original
          : [s.original].filter(Boolean);

      const resolvedBullets = tailoredBullets
        .map((bullet, i) =>
          decisions[i] === false ? originalBullets[i] || bullet : bullet,
        )
        .filter((b) => b && b.trim().length > 10);

      return resolvedBullets.join(" ").trim();
    })();

    // ── Experience ────────────────────────────────────
    const experience = (() => {
      const exp = tc.experience;
      if (!exp) return [];

      const roles = exp.roles_tailored || exp.roles_original || [];

      if (roles.length > 0) {
        return roles
          .map((role) => {
            const decisions = role.bullet_decisions || {};
            const tailoredBullets = role.bullets || [];
            const originalBullets = role.bullets_original || tailoredBullets;

            const bullets = tailoredBullets
              .map((bullet, i) =>
                decisions[i] === false ? originalBullets[i] || bullet : bullet,
              )
              .filter((b) => b && b.trim().length > 10);

            return {
              title: role.title || "",
              company: role.company || "",
              period: role.period || "",
              bullets,
            };
          })
          .filter((role) => role.bullets.length > 0);
      }

      const decisions = exp.bullet_decisions || {};
      const tailoredBullets = exp.bullets_tailored || [];
      const originalBullets = exp.bullets_original || tailoredBullets;

      const bullets = tailoredBullets
        .map((b, i) => (decisions[i] === false ? originalBullets[i] || b : b))
        .filter((b) => b && b.trim().length > 10);

      return bullets.length > 0
        ? [{ title: "Experience", company: "", period: "", bullets }]
        : [];
    })();

    // ── Skills ────────────────────────────────────────
    const skills = (() => {
      const s = tc.skills;
      if (!s) return [];

      const decisions = s.bullet_decisions || {};

      if (Array.isArray(s.bullets_tailored) && s.bullets_tailored.length > 0) {
        const originalBullets = s.bullets_original || s.bullets_tailored;
        return s.bullets_tailored
          .map((bullet, i) =>
            decisions[i] === false ? originalBullets[i] || bullet : bullet,
          )
          .filter((b) => b && b.trim().length > 5);
      }

      const text = Object.values(decisions).some((v) => v === false)
        ? s.original || ""
        : s.tailored || s.original || "";

      return text
        .split("\n")
        .map((l) => l.replace(/^[-•·▪▸►*○●✓\d+.)\s]+/, "").trim())
        .filter((l) => l.length > 5);
    })();

    // ── Education — always from original ──────────────
    const education = (() => {
      const e = tc.education;
      if (!e) return [];
      const text = e.original || "";

      const byDot = text
        .split(/●\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 5);
      if (byDot.length >= 2) return byDot;

      return text
        .split("\n")
        .map((l) => l.replace(/^[-•·▪▸►*○●✓\d+.)\s]+/, "").trim())
        .filter((l) => l.length > 5);
    })();

    // ── Achievements ──────────────────────────────────
    const achievements = (() => {
      const a = tc.achievements;
      if (!a) return [];
      const decisions = a.bullet_decisions || {};
      const tailored = a.bullets_tailored || [];
      const original = a.bullets_original || tailored;

      if (tailored.length > 0) {
        return tailored
          .map((b, i) => (decisions[i] === false ? original[i] || b : b))
          .filter((b) => b && b.trim().length > 10);
      }

      const text = a.tailored || a.original || "";
      return text
        .split("\n")
        .map((l) => l.replace(/^[-•·▪▸►*○●✓\d+.)\s]+/, "").trim())
        .filter((l) => l.length > 10);
    })();

    // ── Projects ──────────────────────────────────────
    const projects = (() => {
      const p = tc.projects;
      if (!p) return [];
      const decisions = p.bullet_decisions || {};
      const tailored = p.bullets_tailored || [];
      const original = p.bullets_original || tailored;

      if (tailored.length > 0) {
        return tailored
          .map((b, i) => (decisions[i] === false ? original[i] || b : b))
          .filter((b) => b && b.trim().length > 10);
      }

      const text = p.tailored || p.original || "";
      return text
        .split("\n")
        .map((l) => l.replace(/^[-•·▪▸►*○●✓\d+.)\s]+/, "").trim())
        .filter((l) => l.length > 10);
    })();

    // ── Contact info ──────────────────────────────────
    const contactInfo = (() => {
      const stored = tc.contact_info;
      if (Array.isArray(stored) && stored.length > 0) {
        return stored[0] || "";
      }
      return "";
    })();

    // ── Generate PDF ──────────────────────────────────
    const pdfBuffer = await generateCVPdf({
      fullName: profile?.full_name || "Your Name",
      contactInfo,
      summary,
      experience,
      skills,
      education,
      achievements,
      projects,
      tone: version.tone || "balanced",
      branding: profile?.branding || {},
    });

    // ── Filename: "Software Engineer (Stripe) - Emmanuel Okang Edim.pdf" ──
    const jobTitle = (version.job_target?.job_title || "Tailored CV")
      .replace(/\s+/g, " ")
      .trim();

    const companyName = (version.job_target?.company_name || "").trim();

    const jobPart = companyName ? `${jobTitle} (${companyName})` : jobTitle;

    const userName = (profile?.full_name || "").trim();

    const fileName = `${jobPart}${userName ? ` - ${userName}` : ""}.pdf`;

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Length": pdfBuffer.length,
    });

    res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF export error:", error);
    res.status(500).json({
      error: "Failed to generate PDF.",
      details: error.message,
    });
  }
};
