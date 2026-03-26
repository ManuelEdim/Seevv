import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MODELS = {
  flash: "gemini-2.5-flash",
  pro: "gemini-2.5-flash",
};

const generateContent = async (prompt, modelTier = "flash", options = {}) => {
  const modelName = MODELS[modelTier] || MODELS.flash;
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxTokens ?? 4096,
      responseMimeType: options.json ? "application/json" : "text/plain",
    },
  });

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  if (options.json) {
    try {
      const cleaned = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      let jsonStr = cleaned;
      if (!jsonStr.endsWith("}")) {
        const opens = (jsonStr.match(/{/g) || []).length;
        const closes = (jsonStr.match(/}/g) || []).length;
        const missing = opens - closes;
        if (jsonStr.lastIndexOf("[") > jsonStr.lastIndexOf("]")) {
          jsonStr += "]";
        }
        for (let i = 0; i < missing; i++) {
          jsonStr += "}";
        }
      }

      return JSON.parse(jsonStr);
    } catch (err) {
      throw new Error(`AI returned invalid JSON: ${text.slice(0, 200)}`);
    }
  }

  return text;
};

// ─── Analyse a job description — Deep Decoder ─────────────

export const analyzeJobDescription = async (jobDescription) => {
  const prompt = `You are a senior talent intelligence analyst with 15 years of experience reading job descriptions with deep scepticism.

Analyse this job description and return a JSON object with exactly this structure:

{
  "hidden_need": "2-3 sentences describing the real business problem behind this posting",
  "hidden_need_confidence": "low|medium|high",
  "culture_tone": "one of: Formal/Corporate | Startup/High-ownership | Process-driven | Remote-first | Agency/Fast-paced",
  "urgency_level": "low|medium|high",
  "ats_keywords": [
    { "keyword": "skill or tool name", "weight": 0-100 }
  ],
  "requirements": [
    { "text": "requirement text", "status": "met|partial|gap", "is_required": true }
  ],
  "signals": [
    { "phrase": "exact phrase from JD", "interpretation": "what this actually signals", "type": "urgency|pain|structure" }
  ],
  "positioning_advice": [
    "specific advice on how to frame the CV for this role"
  ]
}

Rules:
- ats_keywords: return exactly 5 keywords ranked by weight as integers 0-100
- requirements: extract exactly 5-8 requirements
- signals: find exactly 3-5 signals
- positioning_advice: give exactly 3 pieces of advice
- Keep all string values concise — under 150 characters each
- Return ONLY a single valid JSON object, nothing else, no markdown

Job description:
${jobDescription}`;

  return generateContent(prompt, "pro", {
    json: true,
    temperature: 0.3,
    maxTokens: 8192,
  });
};

// ─── Extract ATS keywords only ────────────────────────────

export const extractKeywords = async (jobDescription) => {
  const prompt = `Extract the 10 most important ATS keywords from this job description.
Return a JSON array of objects: [{"keyword": "string", "weight": 0-100}]
Ranked by importance. Return ONLY valid JSON.

Job description: ${jobDescription}`;

  return generateContent(prompt, "flash", { json: true, temperature: 0.1 });
};

// ─── Rewrite a CV bullet point (legacy) ──────────────────

export const rewriteBullet = async (
  original,
  jobDescription,
  voiceSample = null,
) => {
  const voiceInstruction = voiceSample
    ? `The candidate's writing style (match this voice exactly): "${voiceSample.slice(0, 300)}"`
    : "Use professional, confident, first-person implied tone.";

  const prompt = `You are an expert CV writer. Rewrite this CV bullet point to be impact-first and tailored to the job.

Original bullet: "${original}"
Target job description context: "${jobDescription.slice(0, 500)}"
${voiceInstruction}

Rules:
- Start with a strong action verb
- Include measurable outcomes where possible (%, numbers, scale)
- ALWAYS write a complete sentence — never cut off mid-word
- Keep it under 35 words
- Sound natural and human, not generic AI
- Return ONLY the rewritten bullet text, nothing else`;

  return generateContent(prompt, "pro", {
    temperature: 0.6,
    maxTokens: 300,
  });
};

// ─── Rewrite a single bullet with context ─────────────────

export const rewriteSingleBullet = async (
  bullet,
  jobDescription,
  voiceSample = null,
) => {
  if (!bullet || bullet.trim().length < 10) return bullet;

  const voiceInstruction = voiceSample
    ? `Match this writing voice: "${voiceSample.slice(0, 200)}"`
    : "Use professional, confident, past-tense tone.";

  const prompt = `Rewrite this CV bullet point. Return ONLY the complete rewritten bullet — nothing else.

Original: "${bullet.trim()}"
Job context: "${jobDescription.slice(0, 400)}"
${voiceInstruction}

Rules:
- Complete grammatically correct sentence, never cut off mid-word or mid-phrase
- Start with a strong past-tense action verb
- Add measurable outcomes where logical
- Between 15 and 40 words
- Sound human, not generic AI`;

  return generateContent(prompt, "pro", {
    temperature: 0.5,
    maxTokens: 300,
  });
};

// ─── Rewrite all bullets for a section in one batch ───────

export const rewriteBulletsInBatch = async (
  bullets,
  sectionType,
  jobDescription,
  voiceSample = null,
) => {
  if (!bullets || bullets.length === 0) return bullets;

  const voiceInstruction = voiceSample
    ? `Match this writing voice exactly: "${voiceSample.slice(0, 250)}"`
    : "Use professional, confident, past-tense tone.";

  // Include word count so AI matches original length
  const bulletList = bullets
    .map(
      (b, i) => `${i + 1}. ${b.trim()} [${b.trim().split(/\s+/).length} words]`,
    )
    .join("\n");

  const prompt = `You are an expert CV writer. Rewrite these ${sectionType} bullet points to be impact-first and tailored to the job description.

ORIGINAL BULLETS (word count shown in brackets):
${bulletList}

JOB DESCRIPTION CONTEXT:
${jobDescription.slice(0, 600)}

${voiceInstruction}

RULES:
- Rewrite EVERY bullet — return exactly ${bullets.length} bullets
- Each rewritten bullet MUST be within 20% of the original word count shown in brackets
- Each bullet MUST be a complete grammatically correct sentence — never cut off mid-word
- Start each with a strong past-tense action verb
- Add measurable outcomes where logical (%, numbers, scale)
- Sound human and specific, not generic AI
- Preserve all factual details — never fabricate

Return ONLY a numbered list in exactly this format with no extra text:
1. [rewritten bullet]
2. [rewritten bullet]
(continue for all ${bullets.length} bullets)`;

  const result = await generateContent(prompt, "pro", {
    temperature: 0.6,
    maxTokens: 2000,
  });

  const lines = result
    .split("\n")
    .map((l) => l.replace(/^\d+\.\s*/, "").trim())
    .filter((l) => l.length > 20);

  if (lines.length >= Math.ceil(bullets.length * 0.7)) {
    return lines.slice(0, bullets.length);
  }

  console.warn(
    `Batch rewrite returned ${lines.length} bullets, expected ${bullets.length} — using originals`,
  );
  return bullets;
};

// ─── Rewrite an entire CV section ─────────────────────────

export const rewriteCVSection = async (
  sectionType,
  content,
  jobDescription,
  voiceSample = null,
) => {
  const voiceInstruction = voiceSample
    ? `Match this writing voice exactly: "${voiceSample.slice(0, 300)}"`
    : "Use professional, confident tone.";

  // Match original length
  const originalWordCount = content.trim().split(/\s+/).length;
  const minWords = Math.max(50, Math.floor(originalWordCount * 0.85));
  const maxWords = Math.ceil(originalWordCount * 1.15);

  const prompt = `You are an expert CV writer. Rewrite this ${sectionType} section to be tailored for the job.

Original content:
${content}

Target job description:
${jobDescription.slice(0, 800)}

${voiceInstruction}

Rules:
- Write between ${minWords} and ${maxWords} words — match the original length closely
- Preserve all factual information — never fabricate or exaggerate
- Make every line impact-driven and relevant to the job description
- Sound like a human wrote it, not AI
- Return the rewritten section as plain text only — no bullet points, no headers`;

  return generateContent(prompt, "pro", {
    temperature: 0.6,
    maxTokens: 2000,
  });
};

// ─── Calculate match score ────────────────────────────────

export const calculateMatchScore = async (cvText, jobDescription) => {
  const prompt = `Score how well this CV matches this job description.

Return a JSON object:
{
  "overall_score": 0-100,
  "breakdown": {
    "skills_match": 0-100,
    "experience_match": 0-100,
    "keywords_match": 0-100
  },
  "missing_keywords": ["keyword1", "keyword2"],
  "strengths": ["strength1", "strength2"],
  "gaps": ["gap1", "gap2"]
}

Return ONLY valid JSON.

CV: ${cvText.slice(0, 2000)}

Job description: ${jobDescription.slice(0, 1000)}`;

  return generateContent(prompt, "flash", { json: true, temperature: 0.1 });
};

// ─── Generate a cover letter ──────────────────────────────

export const generateCoverLetter = async (
  jobTitle,
  companyName,
  jobDescription,
  cvText,
  tone = "formal",
  voiceSample = null,
) => {
  const toneInstructions = {
    formal: "Professional, traditional, respectful. Formal vocabulary.",
    conversational: "Warm, approachable, personable. Natural language.",
    bold: "Confident, direct, assertive. Strong statements.",
  };

  const voiceInstruction = voiceSample
    ? `Match this writing voice exactly: "${voiceSample.slice(0, 300)}"`
    : `Tone: ${toneInstructions[tone] || toneInstructions.formal}`;

  const prompt = `Write a tailored cover letter for this job application.

Job title: ${jobTitle}
Company: ${companyName}
Tone: ${toneInstructions[tone]}
${voiceInstruction}

Job description context:
${jobDescription.slice(0, 600)}

Candidate's CV summary:
${cvText.slice(0, 800)}

Rules:
- 3-4 paragraphs, 250-350 words total
- Opening: why this specific role and company
- Middle: 2 strongest relevant achievements with context
- Closing: clear call to action
- End with "Yours sincerely," — no name (user will add)
- Sound human and specific, not generic
- Return ONLY the cover letter text, no subject line, no formatting`;

  return generateContent(prompt, "pro", { temperature: 0.7 });
};

// ─── Detect blind spots in a CV ───────────────────────────

export const detectBlindSpots = async (cvText, jobDescription) => {
  const prompt = `Analyse this CV for blind spots — places where the candidate demonstrates a skill or achievement without naming it clearly.

Return a JSON array of objects:
[
  {
    "original_text": "the original CV text with the blind spot",
    "blind_spot": "what skill/achievement is being undersold",
    "suggestion": "how to reframe it more powerfully"
  }
]

Find up to 5 blind spots. Return ONLY valid JSON.

CV: ${cvText.slice(0, 3000)}
Job description: ${jobDescription.slice(0, 500)}`;

  return generateContent(prompt, "flash", { json: true, temperature: 0.3 });
};

// ─── Score how well a section matches a job ───────────────

export const scoreSectionMatch = async (sectionText, jobDescription) => {
  if (!sectionText || sectionText.trim().length < 20) return 0;

  const prompt = `You are an ATS scoring engine. Score how well this CV section matches this job description.

Return ONLY a single integer between 0 and 100. No explanation. No punctuation. Just the number.

Examples of valid responses: 45
Examples of invalid responses: "45/100", "Score: 45", "45%"

CV section:
${sectionText.slice(0, 600)}

Job description:
${jobDescription.slice(0, 500)}

Score (0-100):`;

  try {
    const result = await generateContent(prompt, "flash", {
      temperature: 0.1,
      maxTokens: 5,
    });
    const cleaned = result.trim().replace(/[^0-9]/g, "");
    const score = parseInt(cleaned, 10);
    console.log(`Raw score response: "${result.trim()}" → parsed: ${score}`);
    return isNaN(score) ? 50 : Math.min(100, Math.max(0, score));
  } catch (err) {
    console.warn("Score section failed:", err.message);
    return 50;
  }
};

// ─── Parse a job description (alias for analyzeJobDescription) ───

export const parseJobDescription = async (jobDescription) => {
  return analyzeJobDescription(jobDescription);
};

export default {
  analyzeJobDescription,
  parseJobDescription,
  extractKeywords,
  rewriteBullet,
  rewriteSingleBullet,
  rewriteBulletsInBatch,
  rewriteCVSection,
  calculateMatchScore,
  generateCoverLetter,
  detectBlindSpots,
  scoreSectionMatch,
};
