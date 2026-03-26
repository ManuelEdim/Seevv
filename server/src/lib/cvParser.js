import { createRequire } from "module";
import mammoth from "mammoth";

// pdf-parse doesn't support ES module default import
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

// ─── File parsers ─────────────────────────────────────────

const parsePDF = async (buffer) => {
  const data = await pdfParse(buffer);
  return data.text;
};

const parseDOCX = async (buffer) => {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
};

const parseTXT = (buffer) => {
  return buffer.toString("utf-8");
};

// ─── Main parser ──────────────────────────────────────────

export const parseCV = async (buffer, fileType) => {
  const type = fileType?.toLowerCase().replace(".", "");

  switch (type) {
    case "pdf":
      return parsePDF(buffer);
    case "docx":
    case "doc":
      return parseDOCX(buffer);
    case "txt":
      return parseTXT(buffer);
    default:
      throw new Error(
        `Unsupported file type: ${fileType}. Please upload PDF, DOCX, or TXT.`,
      );
  }
};

// ─── Clean extracted text ─────────────────────────────────

export const cleanText = (text) => {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
};

// ─── Section extractor ────────────────────────────────────
// Uses index-based slicing rather than regex capture groups.
// Debug confirmed raw text has \nSECTION\n newline anchors.
// Summary index=166, Experience index=216 — only 50 chars apart
// in the upper string but the actual content spans 750+ chars.
// Index slicing handles this correctly where regex did not.

export const extractCVSections = (cvText) => {
  const text = cvText.trim();
  const upper = text.toUpperCase();

  const sections = {
    summary: { text: "", bullets: [] },
    experience: { text: "", bullets: [] },
    education: { text: "", bullets: [] },
    skills: { text: "", bullets: [] },
    achievements: { text: "", bullets: [] },
    projects: { text: "", bullets: [] },
    contact_info: [],
  };

  // ── Find all section header positions ─────────────────
  // Look for headers on their own line: "\nHEADER\n"
  const findIdx = (needle) => {
    const withNewlines = `\n${needle}\n`;
    const idx = upper.indexOf(withNewlines);
    if (idx > -1) return idx + 1; // point to start of header word
    // Fallback — header without trailing newline (end of file edge case)
    const plain = upper.indexOf(`\n${needle}`);
    return plain > -1 ? plain + 1 : -1;
  };

  const summaryIdx = findIdx("SUMMARY");
  const experienceIdx = findIdx("EXPERIENCE");

  // Skills header has multiple variants
  const skillsIdx = (() => {
    for (const variant of [
      "CORE SKILLS & TECHNOLOGIES",
      "CORE SKILLS &amp; TECHNOLOGIES",
      "CORE SKILLS",
      "SKILLS",
    ]) {
      const idx = findIdx(variant);
      if (idx > -1) return idx;
    }
    return -1;
  })();

  const educationIdx = findIdx("EDUCATION");
  const certificationsIdx = findIdx("CERTIFICATIONS");
  const portfolioIdx = findIdx("PORTFOLIO");
  const referencesIdx = findIdx("REFERENCES");

  // Helper — find the nearest section end after a given start
  const nextSectionAfter = (startIdx) => {
    return (
      [
        skillsIdx,
        educationIdx,
        certificationsIdx,
        portfolioIdx,
        referencesIdx,
        experienceIdx,
        summaryIdx,
      ]
        .filter((i) => i > startIdx)
        .sort((a, b) => a - b)[0] ?? text.length
    );
  };

  // Helper — slice section content (skip the header line itself)
  const sliceSection = (headerIdx, headerWord, endIdx) => {
    if (headerIdx === -1) return "";
    // Skip past the header word and the following newline
    const afterHeader = text.indexOf("\n", headerIdx + headerWord.length);
    if (afterHeader === -1) return "";
    return text.slice(afterHeader + 1, endIdx).trim();
  };

  // ── Contact info — everything before SUMMARY ──────────
  if (summaryIdx > -1) {
    const contactText = text.slice(0, summaryIdx).trim();
    if (contactText) sections.contact_info = [contactText];
  }

  // ── Summary ───────────────────────────────────────────
  if (summaryIdx > -1 && experienceIdx > -1) {
    const summaryText = sliceSection(summaryIdx, "SUMMARY", experienceIdx);
    sections.summary.text = summaryText;
    sections.summary.bullets = summaryText ? [summaryText] : [];
  }

  // ── Experience ────────────────────────────────────────
  if (experienceIdx > -1) {
    const endIdx =
      skillsIdx > experienceIdx ? skillsIdx : nextSectionAfter(experienceIdx);
    const expText = sliceSection(experienceIdx, "EXPERIENCE", endIdx);
    sections.experience.text = expText;

    // Extract all bullet types: ○ ● and newline-prefixed variants
    const allBullets = expText
      .split(/\n[○●]\s+/)
      .map((s) => s.replace(/\n/g, " ").trim())
      .filter((s) => s.length > 20 && !/^\d+\./.test(s));

    sections.experience.bullets = allBullets;
  }

  // ── Skills ────────────────────────────────────────────
  if (skillsIdx > -1) {
    const endIdx =
      educationIdx > skillsIdx ? educationIdx : nextSectionAfter(skillsIdx);

    // Skills header can be multi-word — find the actual header text
    const skillsHeaderWord = (() => {
      for (const variant of [
        "CORE SKILLS & TECHNOLOGIES",
        "CORE SKILLS",
        "SKILLS",
      ]) {
        if (upper.startsWith(variant, skillsIdx)) return variant;
      }
      return "SKILLS";
    })();

    const skillsText = sliceSection(skillsIdx, skillsHeaderWord, endIdx);
    sections.skills.text = skillsText;

    // Each ● line is a skill category
    const skillBullets = skillsText
      .split(/\n●\s+/)
      .map((s) => s.replace(/\n/g, " ").trim())
      .filter((s) => s.length > 5);

    sections.skills.bullets =
      skillBullets.length >= 2 ? skillBullets : [skillsText];
  }

  // ── Education ─────────────────────────────────────────
  if (educationIdx > -1) {
    const endIdx = nextSectionAfter(educationIdx);
    const eduText = sliceSection(educationIdx, "EDUCATION", endIdx);
    sections.education.text = eduText;

    const eduBullets = eduText
      .split(/\n●\s+/)
      .map((s) => s.replace(/\n/g, " ").trim())
      .filter((s) => s.length > 5);

    sections.education.bullets =
      eduBullets.length >= 2 ? eduBullets : [eduText];
  }

  return sections;
};
