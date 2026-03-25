import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

// Initialise Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ─── Model tiers ──────────────────────────────────────────
const MODELS = {
  // Fast + cheap — keyword extraction, ATS scoring, simple tasks
  flash: "gemini-2.5-flash",
  // Powerful — deep analysis, CV rewriting, hidden need inference
  pro: "gemini-2.5-flash",
};

// ─── Core request function ────────────────────────────────
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

      // Attempt to fix truncated JSON by closing open brackets
      let jsonStr = cleaned;
      if (!jsonStr.endsWith("}")) {
        // Count open vs closed braces and add missing closing braces
        const opens = (jsonStr.match(/{/g) || []).length;
        const closes = (jsonStr.match(/}/g) || []).length;
        const missing = opens - closes;
        // Close any open arrays first
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

// ─── Task-specific AI functions ───────────────────────────

// Analyse a job description — Deep Decoder
export const analyzeJobDescription = async (jobDescription) => {
  const prompt = `You are a senior talent intelligence analyst with 15 years of experience reading job descriptions with deep scepticism.

Analyse this job description and return a JSON object with exactly this structure:

{
  "hidden_need": "2-3 sentences in plain English describing the real business problem behind this posting — what they actually need, not what they say they want",
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
- ats_keywords: return the 5 most important keywords ranked by weight
- requirements: extract up to 8 requirements, distinguish must-have from nice-to-have
- signals: find 3-5 phrases that reveal hidden needs
- positioning_advice: give 3 specific, actionable pieces of advice
- Return ONLY valid JSON, no markdown, no explanation

Job description:
${jobDescription}`;

  return generateContent(prompt, "pro", {
    json: true,
    temperature: 0.3,
    maxTokens: 8192,
  });
};

// Extract ATS keywords only — fast and cheap
export const extractKeywords = async (jobDescription) => {
  const prompt = `Extract the 10 most important ATS keywords from this job description.
Return a JSON array of objects: [{"keyword": "string", "weight": 0-100}]
Ranked by importance. Return ONLY valid JSON.

Job description: ${jobDescription}`;

  return generateContent(prompt, "flash", { json: true, temperature: 0.1 });
};

// Rewrite a CV bullet point — impact-first
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
- Keep it under 25 words
- Sound natural and human, not generic AI
- Return ONLY the rewritten bullet text, nothing else`;

  return generateContent(prompt, "pro", {
    temperature: 0.6,
    maxTokens: 100,
  });
};

// Rewrite an entire CV section
export const rewriteCVSection = async (
  sectionType,
  content,
  jobDescription,
  voiceSample = null,
) => {
  const voiceInstruction = voiceSample
    ? `Match this writing voice exactly: "${voiceSample.slice(0, 300)}"`
    : "Use professional, confident tone.";

  const prompt = `You are an expert CV writer. Rewrite this ${sectionType} section to be tailored for the job.

Original content:
${content}

Target job description:
${jobDescription.slice(0, 800)}

${voiceInstruction}

Rules:
- Preserve all factual information — never fabricate or exaggerate
- Make every line impact-driven
- Sound like a human wrote it, not AI
- Return the rewritten section as plain text only`;

  return generateContent(prompt, "pro", { temperature: 0.6 });
};

// Calculate match score between CV and job description
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

// Generate a cover letter
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

// Detect blind spots in a CV
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

// Smart section scorer — decides if a section needs rewriting
export const scoreSectionMatch = async (sectionText, jobDescription) => {
  if (!sectionText || sectionText.trim().length < 20) return 0;

  const prompt = `Score how well this CV section matches this job description.
Return ONLY a single integer between 0 and 100. Nothing else.

CV section:
${sectionText.slice(0, 500)}

Job description:
${jobDescription.slice(0, 400)}`;

  const result = await generateContent(prompt, "flash", {
    temperature: 0.1,
    maxTokens: 10,
  });

  const score = parseInt(result.trim(), 10);
  return isNaN(score) ? 50 : Math.min(100, Math.max(0, score));
};

// Rewrite a single bullet point with context
export const rewriteSingleBullet = async (
  bullet,
  jobDescription,
  voiceSample = null,
) => {
  if (!bullet || bullet.trim().length < 10) return bullet;

  const voiceInstruction = voiceSample
    ? `Match this writing voice: "${voiceSample.slice(0, 200)}"`
    : "Use professional, confident, first-person implied tone.";

  const prompt = `Rewrite this CV bullet point to be impact-first and tailored to the job.

Original: "${bullet.trim()}"
Job context: "${jobDescription.slice(0, 300)}"
${voiceInstruction}

Rules:
- Start with a strong action verb
- Add measurable outcomes where logical (%, numbers, scale)
- Keep under 30 words
- Sound human, not generic AI
- If already strong and relevant, improve minimally
- Return ONLY the rewritten bullet, nothing else`;

  return generateContent(prompt, "pro", { temperature: 0.5, maxTokens: 80 });
};

export default {
  analyzeJobDescription,
  extractKeywords,
  rewriteBullet,
  rewriteSingleBullet,
  rewriteCVSection,
  calculateMatchScore,
  generateCoverLetter,
  detectBlindSpots,
  scoreSectionMatch,
};
