import puppeteer from "puppeteer";

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
        top: "14mm",
        right: "16mm",
        bottom: "14mm",
        left: "16mm",
      },
      printBackground: true,
    });

    return pdf;
  } finally {
    await browser.close();
  }
};

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

  // ── Strip name from contact info ───────────────────
  const cleanContactInfo = (() => {
    if (!contactInfo) return "";

    const nameLower = (fullName || "").trim().toLowerCase();
    const nameParts = nameLower.split(/\s+/).filter(Boolean);

    return contactInfo
      .split("\n")
      .filter((line) => {
        const lineLower = line.trim().toLowerCase();
        if (!lineLower) return false;
        if (lineLower === nameLower) return false;

        const lineWords = lineLower
          .replace(/[^a-z\s]/g, "")
          .trim()
          .split(/\s+/)
          .filter(Boolean);

        if (lineWords.length >= 2) {
          const allAreNameParts = lineWords.every((word) =>
            nameParts.some(
              (part) =>
                part === word || part.includes(word) || word.includes(part),
            ),
          );
          if (allAreNameParts) return false;
        }

        return true;
      })
      .join("\n")
      .trim();
  })();

  // ── Experience HTML ─────────────────────────────────
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
      font-family: 'Arial', sans-serif;
      font-size: 9.5pt;
      line-height: 1.4;
      color: #1a1a1a;
      background: #ffffff;
    }

    .page {
      max-width: 100%;
    }

    /* ── Header ── */
    .header {
      text-align: center;
      margin-bottom: 8px;
      padding-bottom: 8px;
      border-bottom: 2px solid ${accentColor};
    }

    .name {
      font-size: 18pt;
      font-weight: 700;
      color: ${accentColor};
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }

    .contact {
      font-size: 8pt;
      color: #555;
      line-height: 1.4;
      white-space: pre-line;
    }

    /* ── Sections ── */
    .section {
      margin-bottom: 7px;
    }

    .section-title {
      font-size: 9pt;
      font-weight: 700;
      color: ${accentColor};
      text-transform: uppercase;
      letter-spacing: 1px;
      border-bottom: 1px solid ${accentColor};
      padding-bottom: 1px;
      margin-bottom: 5px;
    }

    /* ── Summary ── */
    .summary-text {
      font-size: 9.5pt;
      line-height: 1.45;
      color: #333;
      text-align: justify;
    }

    /* ── Experience ── */
    .role {
      margin-bottom: 8px;
    }

    .role:last-child {
      margin-bottom: 0;
    }

    .role-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2px;
    }

    .role-left {
      flex: 1;
    }

    .role-title {
      font-size: 9.5pt;
      font-weight: 700;
      color: #1a1a1a;
    }

    .role-company {
      font-size: 8.5pt;
      color: #555;
      font-style: italic;
      margin-top: 1px;
    }

    .role-period-inline {
      font-style: normal;
      color: #777;
      font-size: 8pt;
    }

    /* ── Bullets ── */
    .bullets {
      margin-left: 12px;
      margin-top: 2px;
    }

    .bullets li {
      font-size: 9pt;
      line-height: 1.4;
      color: #333;
      margin-bottom: 1px;
    }

    /* ── Skills ── */
    .skills-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .skills-list li {
      font-size: 9pt;
      line-height: 1.4;
      color: #333;
      margin-bottom: 1px;
    }

    .skills-list li::before {
      content: "● ";
      color: ${accentColor};
      font-size: 7pt;
    }

    /* ── Education ── */
    .education-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .education-list li {
      font-size: 9pt;
      line-height: 1.4;
      color: #333;
      margin-bottom: 1px;
    }

    .education-list li::before {
      content: "● ";
      color: ${accentColor};
      font-size: 7pt;
    }

    /* ── Page break control ── */
    .section {
      break-inside: auto;
      page-break-inside: auto;
    }

    .role {
      page-break-inside: avoid;
      break-inside: avoid;
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
        <p class="summary-text">${escapeHtml(summary.trim())}</p>
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
