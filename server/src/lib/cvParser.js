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
export const extractCVSections = (cvText) => {
  const sections = {
    summary: "",
    experience: "",
    education: "",
    skills: "",
    other: "",
  };

  const lines = cvText.split("\n");
  let currentSection = "other";

  const sectionKeywords = {
    summary: ["summary", "profile", "about", "objective", "overview"],
    experience: [
      "experience",
      "employment",
      "work history",
      "career",
      "positions",
    ],
    education: [
      "education",
      "qualifications",
      "academic",
      "degrees",
      "certifications",
    ],
    skills: ["skills", "competencies", "technologies", "tools", "expertise"],
  };

  for (const line of lines) {
    const lower = line.toLowerCase().trim();

    let detected = false;
    for (const [section, keywords] of Object.entries(sectionKeywords)) {
      if (keywords.some((kw) => lower.includes(kw)) && lower.length < 50) {
        currentSection = section;
        detected = true;
        break;
      }
    }

    if (!detected) {
      sections[currentSection] += line + "\n";
    }
  }

  // Clean up each section
  for (const key of Object.keys(sections)) {
    sections[key] = sections[key].trim();
  }

  return sections;
};
