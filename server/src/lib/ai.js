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
    ? `VOICE MIRRORING — this is the candidate's own writing. Study their sentence rhythm, vocabulary level, use of punctuation, formality, and tone. Mirror it precisely in the rewrite:\n"${voiceSample.slice(0, 500)}"`
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
    ? `VOICE MIRRORING — study and replicate the candidate's personal writing style, sentence rhythm, vocabulary, and tone from this sample:\n"${voiceSample.slice(0, 450)}"`
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
  marketContext = "",
) => {
  if (!bullets || bullets.length === 0) return bullets;

  const voiceInstruction = voiceSample
    ? `VOICE MIRRORING — the candidate provided their own writing sample below. Study their vocabulary choices, sentence rhythm, level of formality, punctuation habits, and natural cadence. Every rewritten bullet MUST sound like this person wrote it — not generic AI:\n"${voiceSample.slice(0, 500)}"`
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
${marketContext ? `\n${marketContext}` : ""}
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
  marketContext = "",
) => {
  const voiceInstruction = voiceSample
    ? `VOICE MIRRORING — carefully study the candidate's writing sample below and replicate their exact voice: their sentence structure, vocabulary, level of detail, formality, and rhythm. The output must feel like the candidate wrote it themselves:\n"${voiceSample.slice(0, 550)}"`
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
${marketContext ? `\n${marketContext}` : ""}
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
  marketContext = "",
) => {
  const toneInstructions = {
    formal: "Professional, traditional, respectful. Formal vocabulary.",
    conversational: "Warm, approachable, personable. Natural language.",
    bold: "Confident, direct, assertive. Strong statements.",
  };

  const voiceInstruction = voiceSample
    ? `VOICE MIRRORING — the candidate provided their own writing below. Mirror their exact voice: vocabulary, sentence rhythm, formality, use of punctuation. The letter must sound like THEM, not a generic AI:\n"${voiceSample.slice(0, 550)}"`
    : `Tone: ${toneInstructions[tone] || toneInstructions.formal}`;

  const prompt = `Write a tailored cover letter for this job application.

Job title: ${jobTitle}
Company: ${companyName}
Tone: ${toneInstructions[tone]}
${voiceInstruction}
${marketContext ? `\n${marketContext}` : ""}
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

// ─────────────────────────────────────────────────────────────
// V2 — INTELLIGENCE LAYER
// ─────────────────────────────────────────────────────────────

// ─── 5.1 Gap-to-Goal Roadmap ──────────────────────────────

export const analyzeSkillGaps = async (cvText, jobDescription) => {
  const prompt = `You are a career intelligence analyst. Compare this CV against the job description and identify every skill, tool, and competency the job requires.

For each skill/requirement, assign:
- status: "green" (clearly demonstrated), "amber" (partially or implicitly demonstrated), or "red" (absent)
- closeness_score: 0-100 (how close the candidate is to meeting this requirement)
- demonstrated: what evidence exists in the CV (null if none)
- gap: what is missing or weak (null if green)

Return a JSON object with this exact structure:
{
  "skills": [
    {
      "skill": "skill or tool name",
      "category": "technical|soft|domain|certification",
      "status": "green|amber|red",
      "closeness_score": 0-100,
      "demonstrated": "evidence from CV or null",
      "gap": "what is missing or null"
    }
  ],
  "summary": {
    "green_count": 0,
    "amber_count": 0,
    "red_count": 0,
    "overall_readiness": 0
  }
}

Rules:
- Identify 8-15 skills total
- Be specific — "React" not "frontend frameworks"
- closeness_score for green ≥ 75, amber 30-74, red < 30
- Return ONLY valid JSON

CV:
${cvText.slice(0, 3000)}

Job description:
${jobDescription.slice(0, 2000)}`;

  return generateContent(prompt, "pro", { json: true, temperature: 0.2, maxTokens: 4096 });
};

export const generateMicroProjects = async (gapSkills, jobDescription, userBackground) => {
  const skillList = gapSkills.map((s) => `${s.skill} (closeness: ${s.closeness_score}%)`).join(", ");

  const prompt = `You are a career coach who creates realistic, time-bounded projects that build portfolio evidence for job seekers.

The candidate has these skill gaps for a target role: ${skillList}

Their background: ${userBackground.slice(0, 500)}

Job context: ${jobDescription.slice(0, 800)}

For each gap skill (prioritise amber and red skills), generate a concrete micro-project.

Return a JSON object:
{
  "projects": [
    {
      "skill": "exact skill name from the gaps list",
      "project_title": "specific actionable project title",
      "description": "2-3 sentence description of what to build and how",
      "time_estimate": "e.g. 1 weekend | 3-5 evenings | 1 week",
      "difficulty": "beginner|intermediate|advanced",
      "portfolio_output": "what artifact this produces (GitHub repo, live demo, case study, etc.)",
      "cv_bullet_template": "a ready-to-use CV bullet template using [X] as placeholder for metrics"
    }
  ]
}

Rules:
- Projects must produce real portfolio evidence, not just course completions
- Be specific to the job context, not generic
- Time estimates must be realistic for a working professional
- Return ONLY valid JSON

`;

  return generateContent(prompt, "pro", { json: true, temperature: 0.6, maxTokens: 4096 });
};

export const suggestCVBulletAfterProject = async (projectTitle, projectDescription, targetRole, existingCV) => {
  const prompt = `You are an expert CV writer. A job seeker just completed a project to fill a skill gap for a target role.

Project: "${projectTitle}"
Description: "${projectDescription}"
Target role: "${targetRole}"

Their existing CV excerpt:
${existingCV.slice(0, 1500)}

Write the best possible CV bullet point for this project. It must:
- Be impact-first (lead with the result or technology, not "I built...")
- Be 15-35 words
- Fit naturally into a Projects or Skills section
- Use metrics placeholders like [X%] or [N users] where applicable

Return a JSON object:
{
  "bullet": "the ready-to-use CV bullet point",
  "section": "Projects|Experience|Skills",
  "rationale": "one sentence explaining why this bullet is framed this way"
}

Return ONLY valid JSON.`;

  return generateContent(prompt, "flash", { json: true, temperature: 0.5, maxTokens: 1024 });
};

// ─── 5.2 Proof-of-Work — AI claim extraction ──────────────

export const extractCVClaims = async (cvText) => {
  const prompt = `You are a CV analyst. Extract the major claims, achievements, and skills from this CV that a candidate would want to provide proof for.

CV:
${cvText.slice(0, 3000)}

Return a JSON array of claims:
[
  {
    "claim": "exact text or paraphrase of the claim from the CV",
    "section": "Experience|Projects|Skills|Achievements|Education",
    "proof_suggestion": "what kind of evidence would support this (e.g. GitHub link, portfolio URL, certificate, case study)"
  }
]

Return 8-15 of the most important claims. Return ONLY valid JSON.`;

  return generateContent(prompt, "flash", { json: true, temperature: 0.2, maxTokens: 2048 });
};

// ─── 5.3 Company Intelligence Panel ───────────────────────

export const analyzeCompanyIntelligence = async (companyName, jobTitle, jobDescription) => {
  const prompt = `You are a talent market intelligence analyst. Provide a structured intelligence briefing on this company and role to help a job seeker decide whether to apply and how to prepare.

Company: ${companyName}
Role: ${jobTitle}
Job description context: ${jobDescription.slice(0, 1000)}

Return a JSON object with this exact structure:
{
  "company_stage": "e.g. Series B | Public | Bootstrapped | Enterprise",
  "company_summary": "2-3 sentences on what the company does and its market position",
  "employee_count_estimate": "e.g. 50-200 | 1,000-5,000",
  "headcount_trend": "Growing rapidly|Growing steadily|Stable|Contracting|Unknown",
  "tech_stack": ["technology1", "technology2"],
  "culture_signals": ["signal1", "signal2"],
  "glassdoor_sentiment": "Very positive|Positive|Mixed|Negative|Unknown",
  "glassdoor_summary": "one sentence on what employees typically say",
  "salary_range": "e.g. £70,000–£95,000 or Unknown",
  "salary_note": "brief note on basis of estimate",
  "apply_recommendation": "strong|moderate|cautious",
  "apply_rationale": "2 sentences on why this recommendation",
  "green_flags": ["positive signal 1", "positive signal 2"],
  "red_flags": ["concern 1"],
  "prep_tips": ["specific preparation tip 1", "specific preparation tip 2", "specific preparation tip 3"],
  "data_note": "Based on AI training data — verify funding/headcount independently before interviews"
}

Rules:
- Be honest about uncertainty — use "Unknown" rather than guess
- tech_stack: infer from JD clues if company stack not known
- prep_tips: role and company specific, not generic advice
- Return ONLY valid JSON`;

  return generateContent(prompt, "pro", { json: true, temperature: 0.3, maxTokens: 4096 });
};

// ─── 5.4 Industry Transition Mode ─────────────────────────

export const analyzeIndustryTransition = async (originIndustry, targetIndustry, cvText, targetJobDescription) => {
  const prompt = `You are an industry transition specialist who helps professionals move between sectors by identifying and reframing transferable skills.

Candidate is moving from: ${originIndustry}
Target industry: ${targetIndustry}
Target role context: ${targetJobDescription.slice(0, 800)}

Their CV:
${cvText.slice(0, 2500)}

Analyse their transition potential and return a JSON object:
{
  "readiness_score": 0-100,
  "transition_narrative": "3-4 sentence narrative framing their transition story positively",
  "transferable_skills": [
    {
      "skill": "universal skill name",
      "origin_term": "how it's described in their current industry",
      "target_term": "how it should be described in the target industry",
      "strength": "strong|moderate|weak",
      "evidence": "specific evidence from their CV"
    }
  ],
  "vocabulary_map": [
    {
      "origin_phrase": "phrase used in CV or origin sector",
      "target_phrase": "equivalent phrase in target industry",
      "rationale": "why this reframing works"
    }
  ],
  "key_gaps": ["gap 1", "gap 2"],
  "quick_wins": ["thing they can do immediately to strengthen their candidacy"],
  "recommended_positioning": "how they should position themselves in the target industry"
}

Rules:
- transferable_skills: find 5-8 skills
- vocabulary_map: identify 5-8 vocabulary translations
- Be specific to the actual industries, not generic
- Return ONLY valid JSON`;

  return generateContent(prompt, "pro", { json: true, temperature: 0.4, maxTokens: 6144 });
};

export const rewriteCVForTransition = async (cvText, vocabularyMap, targetRole, targetIndustry) => {
  const vocabStr = vocabularyMap
    .map((v) => `"${v.origin_phrase}" → "${v.target_phrase}"`)
    .join("\n");

  const prompt = `You are an expert CV writer specialising in industry transitions.

Rewrite the following CV to use the vocabulary and framing of ${targetIndustry}, targeting a ${targetRole} role.

Apply these vocabulary translations throughout:
${vocabStr}

Rules:
- Keep all factual claims — only change framing and vocabulary
- Do not invent experience or metrics
- Maintain the candidate's authentic voice
- Focus particularly on the Summary/Profile section and job title descriptions
- Return the rewritten CV as plain text, preserving section structure

Original CV:
${cvText.slice(0, 3000)}`;

  return generateContent(prompt, "pro", { temperature: 0.5, maxTokens: 4096 });
};

// ─── 5.5 Speed Mode — bulk JD parsing ─────────────────────

export const quickScoreCV = async (cvText, jobDescription) => {
  const prompt = `Score how well this CV matches this job description. Return ONLY a JSON object:
{
  "match_score": 0-100,
  "top_strengths": ["strength 1", "strength 2"],
  "top_gaps": ["gap 1", "gap 2"],
  "recommendation": "strong_match|good_match|partial_match|poor_match"
}

CV (excerpt): ${cvText.slice(0, 1500)}
JD: ${jobDescription.slice(0, 1000)}`;

  return generateContent(prompt, "flash", { json: true, temperature: 0.1, maxTokens: 512 });
};

// ─── Parse a job description (alias for analyzeJobDescription) ───

export const parseJobDescription = async (jobDescription) => {
  return analyzeJobDescription(jobDescription);
};

// ─────────────────────────────────────────────────────────────
// V3 — INTERVIEW & TRUST LAYER
// ─────────────────────────────────────────────────────────────

// 6.1.3 Generate interview prep sheet from tailored CV + decoded JD
export const generateInterviewPrepSheet = async (cvText, jobDescription, companyName, jobTitle, decoderResult = null, marketContext = "") => {
  const companyContext = decoderResult
    ? `Company culture: ${decoderResult.culture_tone || ""}. Hidden need: ${decoderResult.hidden_need || ""}.`
    : "";

  const prompt = `You are an expert interview coach. Generate a personalised interview prep sheet for this candidate.

Job: ${jobTitle} at ${companyName}
${companyContext}
${marketContext ? `\n${marketContext}` : ""}
Candidate's CV (summarised):
${cvText.slice(0, 2500)}

Job description:
${jobDescription.slice(0, 1200)}

Return a JSON object:
{
  "likely_questions": [
    {
      "question": "string — a specific behavioural or competency question grounded in this CV and JD",
      "type": "behavioural | technical | situational | motivation",
      "why_theyll_ask": "string — why this question is relevant to this specific role",
      "star_talking_points": {
        "situation": "string — a specific situation from their CV to draw on",
        "task": "string — the task or challenge",
        "action": "string — concrete actions they could highlight",
        "result": "string — the outcome or metric to emphasise"
      },
      "danger_zone": "string — what a weak answer looks like and how to avoid it"
    }
  ],
  "company_research_angles": ["string — specific angle to research about this company before the interview"],
  "questions_to_ask_them": ["string — smart question the candidate should ask the interviewer"],
  "positioning_statement": "string — 2-3 sentence opening answer to 'Tell me about yourself' drawn from their actual CV",
  "watch_out_for": ["string — potential red flags in their CV they should be ready to address"]
}

Generate 6 likely questions. Return ONLY valid JSON.`;

  return generateContent(prompt, "pro", { json: true, temperature: 0.5 });
};

// 6.1.1 Generate stress-test mock interview questions from tailored CV
export const generateMockInterviewQuestions = async (cvText, jobTitle, companyName, jobDescription, marketContext = "") => {
  const prompt = `You are a tough but fair interviewer at ${companyName} hiring for ${jobTitle}.

Generate 5 stress-test interview questions based ONLY on what is in this candidate's CV — not generic questions.
Each question must probe for genuine depth by referencing a specific claim, achievement, or experience from their CV.
${marketContext ? `\n${marketContext}` : ""}
CV:
${cvText.slice(0, 2500)}

Job description context:
${jobDescription.slice(0, 600)}

Return a JSON array:
[
  {
    "id": 1,
    "question": "string — specific, probing question referencing their actual CV content",
    "cv_reference": "string — the exact part of their CV this question targets",
    "what_good_looks_like": "string — what a strong answer includes",
    "follow_up": "string — the follow-up probe if their answer is vague"
  }
]

Rules:
- Questions must be specific to THIS person's CV — never generic
- Mix of challenge questions, depth probes, and clarification questions
- One question must challenge a potential weakness or gap in their CV
- Return ONLY valid JSON array with exactly 5 questions`;

  return generateContent(prompt, "pro", { json: true, temperature: 0.4 });
};

// 6.1.2 Score a mock interview answer for confidence, clarity, substance
export const scoreMockInterviewAnswer = async (question, answer, cvReference, jobTitle) => {
  const prompt = `You are an expert interview coach scoring a candidate's answer to a mock interview question.

Role: ${jobTitle}
Question: "${question}"
CV context this question targets: "${cvReference}"
Candidate's answer: "${answer}"

Evaluate the answer and return a JSON object:
{
  "readiness_score": 0-100,
  "scores": {
    "substance": 0-100,
    "clarity": 0-100,
    "specificity": 0-100,
    "confidence_tone": 0-100
  },
  "verdict": "string — one sentence overall verdict",
  "strengths": ["string — what they did well"],
  "improvements": ["string — specific, actionable coaching note"],
  "model_answer_snippet": "string — a 2-3 sentence example of what a strong opening to this answer sounds like",
  "missing_elements": ["string — key element a strong answer would include but theirs didn't"]
}

Be honest but constructive. Return ONLY valid JSON.`;

  return generateContent(prompt, "pro", { json: true, temperature: 0.3 });
};

// 6.3 Generate analytics insight from CV version performance data
// ─── Market context builder (Nigeria localisation) ────────

export const buildMarketContext = (country, nyscStatus) => {
  if (country !== "NG") return "";
  const nysc = nyscStatus && nyscStatus !== "not_applicable"
    ? `NYSC status: ${nyscStatus}.`
    : "";
  return `MARKET CONTEXT — This candidate is based in Nigeria (Lagos/Abuja job market). ${nysc}
- Use ₦ for any salary references
- Be familiar with leading Nigerian companies (MTN, Dangote Group, GTBank, Zenith Bank, Flutterwave, Paystack, Interswitch, Access Bank, etc.)
- Reference NYSC where it strengthens a recent graduate's profile
- Align language with Nigerian professional norms and employer expectations
- Acknowledge strong remote opportunities with global companies where relevant`;
};

// ─── Skill profile extraction ──────────────────────────────

export const extractSkillProfile = async (cvText) => {
  const prompt = `You are a senior talent analyst. Extract a comprehensive skill profile from this CV.

CV:
${cvText.slice(0, 4000)}

Return a JSON object with this exact structure:
{
  "level": "junior|mid|senior|executive",
  "summary": "2-sentence description of this person's overall skill profile and career stage",
  "top_skills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
  "technical": [{"skill": "string", "score": 0-100}],
  "soft": [{"skill": "string", "score": 0-100}],
  "domain": [{"skill": "string", "score": 0-100}],
  "gaps": ["string — 3 obvious gaps for someone at this level"]
}

Scoring guide: 90-100 = expert evidence, 70-89 = strong evidence, 50-69 = some evidence, 30-49 = mentioned only.
Return up to 8 skills per category. Return ONLY valid JSON.`;

  return generateContent(prompt, "flash", { json: true, temperature: 0.2, maxTokens: 2048 });
};

// ─── Recruiter mode: rank candidates ──────────────────────

export const rankCandidates = async (jobDescription, candidates) => {
  const candidateBlocks = candidates
    .map((c, i) => `CANDIDATE ${i + 1} — ${c.name}\n${c.cvText.slice(0, 1800)}`)
    .join("\n\n---\n\n");

  const prompt = `You are a senior recruiter. Rank these ${candidates.length} candidates against the job description, from best to worst fit.

JOB DESCRIPTION:
${jobDescription.slice(0, 2000)}

${candidateBlocks}

Return a JSON object:
{
  "rankings": [
    {
      "rank": 1,
      "name": "candidate name (exact as given)",
      "overallScore": 0-100,
      "verdict": "1-2 sentence hiring recommendation",
      "strengths": ["string", "string", "string"],
      "concerns": ["string", "string"],
      "hireable": true
    }
  ],
  "pool_summary": "1-2 sentences on the overall strength of this candidate pool",
  "top_pick": "name of the strongest candidate"
}

Return ONLY valid JSON.`;

  return generateContent(prompt, "pro", { json: true, temperature: 0.3, maxTokens: 3000 });
};

export const generateAnalyticsInsight = async (versionStats) => {
  const prompt = `You are a job search strategist. Analyse this application performance data and return insights.

Data:
${JSON.stringify(versionStats, null, 2)}

Return a JSON object:
{
  "top_performing_pattern": "string — what the best-performing CV versions have in common",
  "underperforming_pattern": "string — what the worst-performing versions have in common",
  "recommendations": ["string — specific actionable recommendations"],
  "predicted_best_role_type": "string — based on match scores, what role type suits this person best"
}

Return ONLY valid JSON.`;

  return generateContent(prompt, "flash", { json: true, temperature: 0.3 });
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
