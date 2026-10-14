import { env } from '../config/env.js';
import { clamp } from '../utils.js';
import { verdictFor } from './analyse.js';

const CANDIDATE_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-2.5-flash-lite',
  'gemini-3.8-flash',
];

/**
 * Analyse a resume against a job description using Google Gemini AI.
 *
 * Calls Google AI Studio's generateContent endpoint with JSON output mode.
 * Returns the exact shape expected by the frontend:
 *   { score, verdict, matched, missing, resumeSkills, jdSkills, breakdown, feedback, aiPowered: true }
 */
export async function analyseWithGemini({ resumeText, jobText }) {
  if (!env.geminiApiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const prompt = `You are an expert technical recruiter and resume ATS parsing engine.
Compare the candidate's resume with the target job description and provide a thorough, objective analysis.

Candidate Resume Text:
"""
${resumeText.slice(0, 8000)}
"""

Target Job Description:
"""
${jobText.slice(0, 4000)}
"""

Analyze and output a valid JSON object strictly matching this schema:
{
  "score": <number between 15 and 98 representing overall match score>,
  "verdict": <string: "Strong match" if score >= 80, "Good start" if score >= 60, "Needs work" if score >= 45, or "Missing key skills">,
  "matched": [<array of exact skill strings from the JD that the resume contains>],
  "missing": [<array of key skill strings required by the JD that the resume lacks>],
  "resumeSkills": [<array of notable technical/domain skills identified on the resume>],
  "jdSkills": [<array of key required/preferred skills in the job description>],
  "breakdown": {
    "coverage": <number 0-100: percentage of target JD skills the candidate satisfies>,
    "density": <number 0-100: vocabulary, domain depth, and technical keyword overlap>,
    "structure": <number 0-100: clarity, formatting, conciseness, and skimmability>
  },
  "feedback": <concise 2-3 sentence assessment explaining candidate alignment and specific gaps to address>
}
`;

  let lastError = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(env.geminiApiKey)}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Gemini API error (${model}: ${response.status}): ${errorBody.slice(0, 160)}`);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error(`No content returned from Gemini model ${model}`);
      }

      const parsed = JSON.parse(rawText);

      const score = Math.round(clamp(Number(parsed.score) || 50, 10, 98));
      const matched = Array.isArray(parsed.matched) ? parsed.matched.map(String) : [];
      const missing = Array.isArray(parsed.missing) ? parsed.missing.map(String) : [];
      const resumeSkills = Array.isArray(parsed.resumeSkills) ? parsed.resumeSkills.map(String) : matched;
      const jdSkills = Array.isArray(parsed.jdSkills) ? parsed.jdSkills.map(String) : [...matched, ...missing];

      return {
        score,
        verdict: parsed.verdict || verdictFor(score),
        matched,
        missing,
        resumeSkills,
        jdSkills,
        breakdown: {
          coverage: Math.round(clamp(Number(parsed.breakdown?.coverage) || 50, 0, 100)),
          density: Math.round(clamp(Number(parsed.breakdown?.density) || 50, 0, 100)),
          structure: Math.round(clamp(Number(parsed.breakdown?.structure) || 50, 0, 100)),
        },
        feedback: typeof parsed.feedback === 'string' ? parsed.feedback.trim() : '',
        aiPowered: true,
        modelUsed: model,
      };
    } catch (err) {
      lastError = err;
      // Try next model if one failed or is experiencing temporary spikes
      console.warn(`[gemini] ${model} attempt failed: ${err.message}. Trying next candidate...`);
    }
  }

  throw lastError || new Error('All Gemini models failed to respond.');
}

