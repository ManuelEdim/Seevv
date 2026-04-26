import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  TabStopType,
  TabStopPosition,
  convertInchesToTwip,
} from "docx";

const BRAND = "#033876";

// ─── Helpers ──────────────────────────────────────────────
const sectionHeading = (text) =>
  new Paragraph({
    text: text.toUpperCase(),
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 60 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: "033876", space: 4 },
    },
    run: {
      bold: true,
      color: "033876",
      size: 20,
      font: "Calibri",
    },
  });

const bodyParagraph = (text) =>
  new Paragraph({
    children: [new TextRun({ text: text || "", size: 20, font: "Calibri", color: "374151" })],
    spacing: { after: 80 },
  });

const bulletItem = (text) =>
  new Paragraph({
    children: [new TextRun({ text: text || "", size: 20, font: "Calibri", color: "374151" })],
    bullet: { level: 0 },
    spacing: { after: 60 },
  });

const roleHeader = (title, company, period) => {
  const titleText = [title, company].filter(Boolean).join(" · ");
  return new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
    children: [
      new TextRun({ text: titleText, bold: true, size: 21, font: "Calibri", color: "111827" }),
      ...(period ? [new TextRun({ text: `\t${period}`, size: 19, font: "Calibri", color: "6b7280" })] : []),
    ],
    spacing: { before: 120, after: 40 },
  });
};

// ─── Main generator ───────────────────────────────────────
export const generateCVDocx = async ({
  fullName,
  contactInfo,
  summary,
  experience,
  skills,
  education,
  achievements,
  projects,
}) => {
  const children = [];

  // ── Name ─────────────────────────────────────────────────
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: fullName || "Your Name",
          bold: true,
          size: 40,
          font: "Calibri",
          color: "033876",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
    }),
  );

  // ── Contact info ─────────────────────────────────────────
  if (contactInfo) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: contactInfo, size: 18, font: "Calibri", color: "6b7280" })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
    );
  }

  // ── Summary ──────────────────────────────────────────────
  if (summary) {
    children.push(sectionHeading("Professional Summary"));
    children.push(bodyParagraph(summary));
  }

  // ── Experience ───────────────────────────────────────────
  if (experience?.length > 0) {
    children.push(sectionHeading("Experience"));
    for (const role of experience) {
      children.push(roleHeader(role.title, role.company, role.period));
      for (const bullet of role.bullets || []) {
        children.push(bulletItem(bullet));
      }
    }
  }

  // ── Skills ───────────────────────────────────────────────
  if (skills?.length > 0) {
    children.push(sectionHeading("Skills"));
    children.push(bodyParagraph(skills.join(" · ")));
  }

  // ── Achievements ─────────────────────────────────────────
  if (achievements?.length > 0) {
    children.push(sectionHeading("Key Achievements"));
    for (const item of achievements) {
      children.push(bulletItem(item));
    }
  }

  // ── Projects ─────────────────────────────────────────────
  if (projects?.length > 0) {
    children.push(sectionHeading("Projects"));
    for (const item of projects) {
      children.push(bulletItem(item));
    }
  }

  // ── Education ────────────────────────────────────────────
  if (education?.length > 0) {
    children.push(sectionHeading("Education"));
    for (const item of education) {
      children.push(bulletItem(item));
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 20, color: "374151" },
        },
        heading2: {
          run: { bold: true, color: "033876", size: 20, font: "Calibri" },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.75),
              right: convertInchesToTwip(0.75),
              bottom: convertInchesToTwip(0.75),
              left: convertInchesToTwip(0.75),
            },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
};
