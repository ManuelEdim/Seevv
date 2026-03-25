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
// Built specifically for the flat-text format that mammoth
// produces from DOCX files — sections run together on one
// line separated by ALL-CAPS keywords like SUMMARY, EXPERIENCE
// Bullets are marked with ○ (experience) or ● (skills)

export const extractCVSections = (cvText) => {
  const text = cvText.trim();

  const sections = {
    summary: { text: "", bullets: [] },
    experience: { text: "", bullets: [] },
    education: { text: "", bullets: [] },
    skills: { text: "", bullets: [] },
    achievements: { text: "", bullets: [] },
    projects: { text: "", bullets: [] },
    contact_info: [],
  };

  // ── Contact info — everything before SUMMARY ──────────
  const contactMatch = text.match(/^([\s\S]*?)(?=\bSUMMARY\b)/i);
  if (contactMatch && contactMatch[1].trim()) {
    sections.contact_info = [contactMatch[1].trim()];
  }

  // ── Summary ───────────────────────────────────────────
  const summaryMatch = text.match(
    /\bSUMMARY\b\s+([\s\S]*?)(?=\bEXPERIENCE\b|\bEDUCATION\b|\bCORE\s+SKILLS\b|\bSKILLS\b|\bACHIEVEMENTS\b|\bPROJECTS\b)/i,
  );
  if (summaryMatch) {
    sections.summary.text = summaryMatch[1].trim();
    // Summary is prose — treat the whole thing as one bullet
    sections.summary.bullets = [summaryMatch[1].trim()];
  }

  // ── Experience ────────────────────────────────────────
  const experienceMatch = text.match(
    /\bEXPERIENCE\b\s+([\s\S]*?)(?=\bCORE\s+SKILLS\b|\bSKILLS\b|\bEDUCATION\b|\bCERTIFICATIONS\b|\bPORTFOLIO\b|\bREFERENCES\b)/i,
  );
  if (experienceMatch) {
    const expText = experienceMatch[1].trim();
    sections.experience.text = expText;
    // Extract all ○ bullets
    sections.experience.bullets = expText
      .split(/○\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20 && !s.match(/^\d+\./)); // exclude numbered role headers
  }

  // ── Skills ────────────────────────────────────────────
  const skillsMatch = text.match(
    /\b(?:CORE\s+SKILLS|SKILLS)\b\s*(?:&\s*TECHNOLOGIES)?\s+([\s\S]*?)(?=\bEDUCATION\b|\bCERTIFICATIONS\b|\bPORTFOLIO\b|\bREFERENCES\b|\bINTERESTS\b|$)/i,
  );
  if (skillsMatch) {
    const skillsText = skillsMatch[1].trim();
    sections.skills.text = skillsText;
    // Extract ● bullets — each skill category is a bullet
    const skillBullets = skillsText
      .split(/●\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 5);
    sections.skills.bullets =
      skillBullets.length >= 2 ? skillBullets : [skillsText];
  }

  // ── Education ─────────────────────────────────────────
  const educationMatch = text.match(
    /\bEDUCATION\b\s+([\s\S]*?)(?=\bCERTIFICATIONS\b|\bPORTFOLIO\b|\bREFERENCES\b|\bINTERESTS\b|$)/i,
  );
  if (educationMatch) {
    const eduText = educationMatch[1].trim();
    sections.education.text = eduText;
    sections.education.bullets = eduText
      .split(/●\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 5);
  }

  return sections;
};
