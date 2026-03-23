import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

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
