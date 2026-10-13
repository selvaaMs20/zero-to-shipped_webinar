import {
  BASELINE_SKILLS,
  SENIORITY_FLAGS,
  findSkills,
} from './skills.js';
import { clamp } from '../utils.js';

/** How much the three parts of the score are worth. Must sum to 1. */
const WEIGHTS = {
  coverage: 0.65, // do the JD's skills appear in the resume?
  density: 0.2,   // how much of the JD's vocabulary the resume carries
  structure: 0.15, // is it a document a human can skim?
};

/** JD-wide inflation gets taken out in `inflationRatio` below. */

export function verdictFor(score) {
  if (score >= 80) return 'Strong match';
  if (score >= 60) return 'Good start';
  if (score >= 45) return 'Needs work';
  return 'Missing key skills';
}

/** Every distinct word of 4+ characters, lowercased. */
function keywords(text) {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9+#. ]/g, ' ')
      .split(/\s+/)
      .map((w) => w.replace(/^\.+|\.+$/g, ''))
      .filter((w) => w.length >= 4),
  );
}

/**
 * How demanding the JD reads. A JD asking for a decade of experience and a
 * dozen exotic tools is not the same bar as one asking for two years and
 * the usual stack, and scoring both out of 100 flatters nobody.
 */
function inflationRatio(jobText) {
  const lower = jobText.toLowerCase();
  const flags = SENIORITY_FLAGS.filter((flag) => lower.includes(flag)).length;

  const years = [...lower.matchAll(/(\d{1,2})\+?\s*(?:-\s*\d{1,2}\s*)?years?/g)]
    .map((m) => Number(m[1]));
  const maxYears = years.length ? Math.max(...years) : 0;

  // Each flag and each year past three shaves a little off.
  const fromFlags = flags * 0.02;
  const fromYears = Math.max(0, maxYears - 3) * 0.015;
  return clamp(1 - fromFlags - fromYears, 0.8, 1);
}

/**
 * The JD's skills that matter, most important first.
 *
 * Every skill on the resume is one the JD asked for, so a JD listing
 * everything under the sun would score a mediocre resume highly. If the JD
 * names more than `JD_SKILL_CAP` skills we keep the ones it repeats, which
 * are the ones the employer actually cares about, and drop the tail.
 */
const JD_SKILL_CAP = 12;

function rankedJdSkills(jobText, jdSkills) {
  if (jdSkills.length <= JD_SKILL_CAP) return jdSkills;

  const lower = jobText.toLowerCase();
  const mentions = (skill) => {
    const first = lower.indexOf(skill.toLowerCase().split(' ')[0]);
    let count = 0;
    let from = 0;
    let at;
    while ((at = lower.indexOf(skill.toLowerCase().split(' ')[0], from)) !== -1) {
      count += 1;
      from = at + 1;
    }
    return first === -1 ? count : count;
  };

  return [...jdSkills]
    .sort((a, b) => mentions(b) - mentions(a))
    .slice(0, JD_SKILL_CAP)
    .sort((a, b) => jdSkills.indexOf(a) - jdSkills.indexOf(b));
}

/**
 * Does the text look like a resume a human could skim, or one wall of
 * prose? Real exports have headings, dates and bullets; the score nudges
 * upward for each signal.
 */
function structureScore(text) {
  const lines = text.split('\n').filter((line) => line.trim());
  if (!lines.length) return 0;

  const bulletLines = lines.filter((l) => /^\s*[-•*·▪◦]/.test(l)).length;
  const yearLines = lines.filter((l) => /(19|20)\d{2}/.test(l)).length;
  const shortHeadingLines = lines.filter(
    (l) => l.trim().length > 1 && l.trim().length < 40 && !/[.!?]$/.test(l.trim()),
  ).length;

  const signals = [
    clamp((bulletLines / lines.length) * 400), // a few bullets already counts
    clamp((yearLines / lines.length) * 500),
    clamp((shortHeadingLines / lines.length) * 250),
  ];

  return Math.round(signals.reduce((a, b) => a + b, 0) / signals.length);
}

/**
 * Score a resume against a job description.
 *
 * Pure and synchronous: same two strings in, same result out. Keeping it
 * that way is what makes the route testable and the score explainable.
 *
 * Returns:
 *   { score, verdict, matched, missing, resumeSkills, jdSkills, breakdown }
 */
export function analyseDocuments({ resumeText, jobText }) {
  const resumeSkills = findSkills(resumeText);
  const jdSkills = findSkills(jobText);

  // A JD that names no skill we know is not a reason to score zero - fall
  // back to the baseline set so the learner still gets something to act on.
  const targets = rankedJdSkills(jobText, jdSkills.length ? jdSkills : BASELINE_SKILLS);

  const matched = targets.filter((skill) => resumeSkills.includes(skill));
  const missing = targets.filter((skill) => !resumeSkills.includes(skill));

  const coverage = targets.length ? matched.length / targets.length : 0;

  // Vocabulary overlap: how much of the JD's wording the resume echoes.
  const jdWords = keywords(jobText);
  const resumeWords = keywords(resumeText);
  let overlap = 0;
  for (const word of jdWords) if (resumeWords.has(word)) overlap += 1;
  const density = jdWords.size ? overlap / jdWords.size : 0;

  const structure = structureScore(resumeText) / 100;

  const raw =
    coverage * WEIGHTS.coverage +
    clamp(density * 1.6, 0, 1) * WEIGHTS.density + // 1.6: 60% word overlap is already a lot
    structure * WEIGHTS.structure;

  const score = Math.round(clamp(raw * 100 * inflationRatio(jobText), 12, 97));

  return {
    score,
    verdict: verdictFor(score),
    matched,
    missing,
    resumeSkills,
    jdSkills: targets,
    breakdown: {
      coverage: Math.round(coverage * 100),
      density: Math.round(density * 100),
      structure: Math.round(structure * 100),
    },
  };
}
