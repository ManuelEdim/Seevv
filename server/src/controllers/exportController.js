import { generateCVPdf } from "../lib/pdfGenerator.js";
import { supabase } from "../lib/supabase.js";

export const exportCVAsPdf = async (req, res) => {
  const { versionId } = req.body;
  const userId = req.user.id;

  try {
    // Get CV version with all related data
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

    // Get user profile for name
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", userId)
      .single();

    const tc = version.tailored_content || {};

    // ── Compile accepted content ───────────────────────

    // Summary — use tailored if accepted, original if rejected
    const summary = (() => {
      const s = tc.summary;
      if (!s) return "";
      if (s.accepted === false) return s.original || "";
      const text = s.tailored || s.original || "";
      // Return first paragraph only for summary
      return text.split("\n").filter((l) => l.trim().length > 20)[0] || text;
    })();

    // Experience — compile roles with accepted bullets
    const experience = (() => {
      const exp = tc.experience;
      if (!exp) return [];

      const roles = exp.roles_tailored || exp.roles_original || [];

      if (roles.length > 0) {
        return roles.map((role) => ({
          title: role.title || "",
          company: role.company || "",
          period: role.period || "",
          bullets: (role.bullets || []).filter(
            (b) => b && b.trim().length > 10,
          ),
        }));
      }

      // Fallback — flat bullets
      const bullets = (exp.bullets_tailored || []).filter(
        (b) => b && b.trim().length > 10,
      );

      return bullets.length > 0
        ? [{ title: "Experience", company: "", period: "", bullets }]
        : [];
    })();

    // Skills — extract as list items
    const skills = (() => {
      const s = tc.skills;
      if (!s) return [];
      const text =
        s.accepted === false
          ? s.original || ""
          : s.tailored || s.original || "";

      return text
        .split("\n")
        .map((l) => l.replace(/^[-•·▪▸►*○✓●\d+.)\s]+/, "").trim())
        .filter((l) => l.length > 5);
    })();

    // Education — from original (always kept)
    const education = (() => {
      const e = tc.education;
      if (!e) return [];
      const text = e.original || "";
      return text
        .split("\n")
        .map((l) => l.replace(/^[-•·▪▸►*○✓●\d+.)\s]+/, "").trim())
        .filter((l) => l.length > 5);
    })();

    // Achievements
    const achievements = (() => {
      const a = tc.achievements;
      if (!a) return [];
      const text = a.tailored || a.original || "";
      return text
        .split("\n")
        .map((l) => l.replace(/^[-•·▪▸►*○✓●\d+.)\s]+/, "").trim())
        .filter((l) => l.length > 10);
    })();

    // Projects
    const projects = (() => {
      const p = tc.projects;
      if (!p) return [];
      const text = p.tailored || p.original || "";
      return text
        .split("\n")
        .map((l) => l.replace(/^[-•·▪▸►*○✓●\d+.)\s]+/, "").trim())
        .filter((l) => l.length > 10);
    })();

    // Contact info from stored data
    const contactInfo = (() => {
      const stored = tc.contact_info;
      if (Array.isArray(stored) && stored.length > 0) {
        return (
          stored[0]
            ?.split("|")
            .map((s) => s.trim())
            .join(" | ") || ""
        );
      }
      return "";
    })();

    // ── Generate PDF ───────────────────────────────────
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
    });

    // ── Send as download ───────────────────────────────
    const fileName = `${(profile?.full_name || "CV").replace(/\s+/g, "_")}_${
      version.job_target?.job_title?.replace(/\s+/g, "_") || "Tailored"
    }.pdf`;

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
