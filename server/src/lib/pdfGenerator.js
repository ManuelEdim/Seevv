import puppeteer from "puppeteer";

// ─── Generate a CV PDF from structured content ────────────

export const generateCVPdf = async (cvData) => {
  const {
    fullName,
    contactInfo,
    summary,
    experience,
    skills,
    education,
    achievements,
    projects,
    tone = "balanced",
  } = cvData;

  const html = buildCVHtml({
    fullName,
    contactInfo,
    summary,
    experience,
    skills,
    education,
    achievements,
    projects,
    tone,
  });

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      margin: {
        top: "20mm",
        right: "20mm",
        bottom: "20mm",
        left: "20mm",
      },
      printBackground: true,
    });

    return pdf;
  } finally {
    await browser.close();
  }
};

// ─── Build the CV HTML template ───────────────────────────

const buildCVHtml = ({
  fullName,
  contactInfo,
  summary,
  experience,
  skills,
  education,
  achievements,
  projects,
  tone,
}) => {
  const accentColor = tone === "bold" ? "#1a1a2e" : "#534ab7";

  // ── Strip name from contact info if it appears there ───
  // Prevents the name appearing twice (once in header, once in contact block)
  const cleanContactInfo = (() => {
    if (!contactInfo) return "";
    const nameVariants = [
      fullName?.trim(),
      fullName?.trim().toUpperCase(),
    ].filter(Boolean);

    return contactInfo
      .split("\n")
      .filter((line) => {
        const trimmed = line.trim();
        return !nameVariants.some(
          (name) =>
            trimmed === name || trimmed.toUpperCase() === name.toUpperCase(),
        );
      })
      .join("\n")
      .trim();
  })();

  // ── Experience HTML ─────────────────────────────────────
  const experienceHtml = (experience || [])
    .map(
      (role) => `
      <div class="role">
        <div class="role-header">
          <div class="role-left">
            <p class="role-title">${escapeHtml(role.title || "")}</p>
            ${
              role.company
                ? `<p class="role-company">${escapeHtml(role.company)}${
                    role.period
                      ? ` <span class="role-period-inline">· ${escapeHtml(role.period)}</span>`
                      : ""
                  }</p>`
                : role.period
                  ? `<p class="role-company"><span class="role-period-inline">${escapeHtml(role.period)}</span></p>`
                  : ""
            }
          </div>
        </div>
        <ul class="bullets">
          ${(role.bullets || [])
            .map((b) => `<li>${escapeHtml(b)}</li>`)
            .join("")}
        </ul>
      </div>
    `,
    )
    .join("");

  const skillsHtml = (skills || [])
    .map((s) => `<li>${escapeHtml(s)}</li>`)
    .join("");

  const educationHtml = (education || [])
    .map((e) => `<li>${escapeHtml(e)}</li>`)
    .join("");

  const achievementsHtml =
    achievements && achievements.length > 0
      ? `
      <div class="section">
        <h2 class="section-title">Achievements</h2>
        <ul class="bullets">
          ${achievements.map((a) => `<li>${escapeHtml(a)}</li>`).join("")}
        </ul>
      </div>
    `
      : "";

  const projectsHtml =
    projects && projects.length > 0
      ? `
      <div class="section">
        <h2 class="section-title">Projects</h2>
        <ul class="bullets">
          ${projects.map((p) => `<li>${escapeHtml(p)}</li>`).join("")}
        </ul>
      </div>
    `
      : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(fullName || "CV")} — CV</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      font-size: 10.5pt;
      line-height: 1.5;
      color: #1a1a1a;
      background: #ffffff;
    }

    .page {
      max-width: 100%;
    }

    /* ── Header ── */
    .header {
      text-align: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid ${accentColor};
    }

    .name {
      font-family: 'Arial', sans-serif;
      font-size: 22pt;
      font-weight: 700;
      color: ${accentColor};
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .contact {
      font-family: 'Arial', sans-serif;
      font-size: 9pt;
      color: #555;
      line-height: 1.6;
      white-space: pre-line;
    }

    .contact a {
      color: ${accentColor};
      text-decoration: none;
    }

    /* ── Sections ── */
    .section {
      margin-bottom: 14px;
    }

    .section-title {
      font-family: 'Arial', sans-serif;
      font-size: 10pt;
      font-weight: 700;
      color: ${accentColor};
      text-transform: uppercase;
      letter-spacing: 1.2px;
      border-bottom: 1px solid ${accentColor};
      padding-bottom: 2px;
      margin-bottom: 8px;
    }

    /* ── Summary ── */
    .summary-text {
      font-size: 10.5pt;
      line-height: 1.6;
      color: #333;
      text-align: justify;
    }

    /* ── Experience ── */
    .role {
      margin-bottom: 12px;
    }

    .role:last-child {
      margin-bottom: 0;
    }

    .role-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 4px;
    }

    .role-left {
      flex: 1;
    }

    .role-title {
      font-family: 'Arial', sans-serif;
      font-size: 10.5pt;
      font-weight: 700;
      color: #1a1a1a;
    }

    .role-company {
      font-family: 'Arial', sans-serif;
      font-size: 9.5pt;
      color: #555;
      font-style: italic;
      margin-top: 1px;
    }

    .role-period-inline {
      font-style: normal;
      color: #777;
      font-size: 9pt;
    }

    /* ── Bullets ── */
    .bullets {
      margin-left: 16px;
      margin-top: 4px;
    }

    .bullets li {
      font-size: 10pt;
      line-height: 1.5;
      color: #333;
      margin-bottom: 2px;
    }

    /* ── Skills ── */
    .skills-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .skills-list li {
      font-size: 10pt;
      line-height: 1.5;
      color: #333;
      margin-bottom: 2px;
      padding-left: 0;
    }

    .skills-list li::before {
      content: "● ";
      color: ${accentColor};
      font-size: 8pt;
    }

    /* ── Education ── */
    .education-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .education-list li {
      font-size: 10pt;
      line-height: 1.5;
      color: #333;
      margin-bottom: 2px;
    }

    .education-list li::before {
      content: "● ";
      color: ${accentColor};
      font-size: 8pt;
    }

    /* ── Page break control ── */
    .role {
      page-break-inside: avoid;
    }

    .section {
      page-break-inside: avoid;
    }
  </style>
</head>
<body>
  <div class="page">

    <!-- Header — name appears once only -->
    <div class="header">
      <p class="name">${escapeHtml(fullName || "Your Name")}</p>
      ${cleanContactInfo ? `<p class="contact">${escapeHtml(cleanContactInfo)}</p>` : ""}
    </div>

    <!-- Summary -->
    ${
      summary
        ? `
      <div class="section">
        <h2 class="section-title">Summary</h2>
        <p class="summary-text">${escapeHtml(summary)}</p>
      </div>
    `
        : ""
    }

    <!-- Experience -->
    ${
      experience && experience.length > 0
        ? `
      <div class="section">
        <h2 class="section-title">Experience</h2>
        ${experienceHtml}
      </div>
    `
        : ""
    }

    <!-- Skills -->
    ${
      skills && skills.length > 0
        ? `
      <div class="section">
        <h2 class="section-title">Core Skills &amp; Technologies</h2>
        <ul class="skills-list">
          ${skillsHtml}
        </ul>
      </div>
    `
        : ""
    }

    <!-- Achievements -->
    ${achievementsHtml}

    <!-- Projects -->
    ${projectsHtml}

    <!-- Education -->
    ${
      education && education.length > 0
        ? `
      <div class="section">
        <h2 class="section-title">Education</h2>
        <ul class="education-list">
          ${educationHtml}
        </ul>
      </div>
    `
        : ""
    }

  </div>
</body>
</html>
  `;
};

// ─── HTML escape helper ───────────────────────────────────

const escapeHtml = (text) => {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// ─── Helper to format dates ───────────────────────────────────
const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });
};
export default {};
