import fs from "fs";
import path from "path";
import { createRequire } from "module";
import mammoth from "mammoth";

// pdf-parse doesn't support ES module default import
// use createRequire to load it as CommonJS
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

// Parse a PDF buffer to plain text
const parsePDF = async (buffer) => {
  const data = await pdfParse(buffer);
  return data.text;
};

// Parse a DOCX buffer to plain text
const parseDOCX = async (buffer) => {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
};

// Parse a TXT buffer to plain text
const parseTXT = (buffer) => {
  return buffer.toString("utf-8");
};

// Main parser — detects file type and routes accordingly
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

// Clean extracted text — remove excessive whitespace and blank lines
export const cleanText = (text) => {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
};

// Extract structured sections from CV text using simple heuristics
// Detect if a line is a section header
const isSectionHeader = (line) => {
  const trimmed = line.trim();
  if (trimmed.length === 0 || trimmed.length > 60) return false;

  // All caps line = likely a header
  if (trimmed === trimmed.toUpperCase() && trimmed.length > 2) return true;

  // Common header patterns
  const headerPatterns = [
    /^(professional\s+)?summary$/i,
    /^(work\s+)?experience$/i,
    /^employment(\s+history)?$/i,
    /^career(\s+history)?$/i,
    /^education(\s+&\s+training)?$/i,
    /^qualifications?$/i,
    /^(technical\s+)?skills?$/i,
    /^competenc(y|ies)$/i,
    /^(key\s+)?achievements?$/i,
    /^certifications?$/i,
    /^projects?$/i,
    /^publications?$/i,
    /^references?$/i,
    /^profile$/i,
    /^objective$/i,
    /^about(\s+me)?$/i,
    /^languages?$/i,
    /^interests?$/i,
    /^hobbies?$/i,
    /^volunteering?$/i,
  ];

  return headerPatterns.some((pattern) => pattern.test(trimmed));
};

// Map detected header to a canonical section name
const mapToSection = (line) => {
  const lower = line.toLowerCase().trim();

  if (/summary|profile|about|objective|overview/.test(lower)) return "summary";
  if (/experience|employment|career|work history|positions/.test(lower))
    return "experience";
  if (/education|qualifications|academic|degree|certif/.test(lower))
    return "education";
  if (/skill|competenc|technolog|tools|expertise/.test(lower)) return "skills";
  if (/achievement|accomplishment/.test(lower)) return "achievements";
  if (/project/.test(lower)) return "projects";
  if (/language/.test(lower)) return "languages";
  if (/interest|hobb/.test(lower)) return "interests";
  if (/reference/.test(lower)) return "references";
  if (/volunteer/.test(lower)) return "volunteering";

  return null;
};

// Extract individual bullet points from a section
const extractBullets = (text) => {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const bullets = [];

  for (const line of lines) {
    // Remove common bullet characters
    const cleaned = line.replace(/^[-•·▪▸►*]\s*/, "").trim();
    if (cleaned.length > 15) {
      bullets.push(cleaned);
    }
  }

  return bullets;
};

// Main section extractor — fully rebuilt
export const extractCVSections = (cvText) => {
  const lines = cvText.split("\n");

  const sections = {
    summary: { text: "", bullets: [] },
    experience: { text: "", bullets: [] },
    education: { text: "", bullets: [] },
    skills: { text: "", bullets: [] },
    achievements: { text: "", bullets: [] },
    projects: { text: "", bullets: [] },
    languages: { text: "", bullets: [] },
    interests: { text: "", bullets: [] },
    other: { text: "", bullets: [] },
  };

  let currentSection = "other";
  let currentContent = [];
  let contactInfo = [];
  let inContactBlock = true; // First few lines are usually contact info

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines but track them
    if (!trimmed) {
      if (currentContent.length > 0) {
        currentContent.push("");
      }
      continue;
    }

    // Collect contact info from the first block
    if (inContactBlock && i < 8) {
      const isEmail = /\S+@\S+\.\S+/.test(trimmed);
      const isPhone = /[\d\s\-\+\(\)]{7,}/.test(trimmed);
      const isUrl = /linkedin|github|http|www/.test(trimmed.toLowerCase());

      if (isEmail || isPhone || isUrl) {
        contactInfo.push(trimmed);
        continue;
      }
    }

    // Check if this line is a section header
    if (isSectionHeader(trimmed)) {
      // Save previous section content
      if (currentContent.length > 0) {
        const sectionText = currentContent.join("\n").trim();
        if (sections[currentSection]) {
          sections[currentSection].text += sectionText + "\n";
          sections[currentSection].bullets.push(...extractBullets(sectionText));
        }
        currentContent = [];
      }

      // Detect new section
      const mapped = mapToSection(trimmed);
      currentSection = mapped || "other";
      inContactBlock = false;
      continue;
    }

    inContactBlock = false;
    currentContent.push(line);
  }

  // Save the last section
  if (currentContent.length > 0) {
    const sectionText = currentContent.join("\n").trim();
    if (sections[currentSection]) {
      sections[currentSection].text += sectionText + "\n";
      sections[currentSection].bullets.push(...extractBullets(sectionText));
    }
  }

  // Clean up sections
  const result = {};
  for (const [key, value] of Object.entries(sections)) {
    result[key] = {
      text: value.text.trim(),
      bullets: value.bullets.filter((b) => b.length > 10),
    };
  }

  result.contact_info = contactInfo;

  return result;
};
