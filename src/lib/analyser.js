/**
 * The "target role" this resume is scored against.
 * Change this list to change what the parser looks for.
 */
export const ROLE_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'HTML', 'CSS',
  'Git', 'REST APIs', 'Node.js', 'Testing', 'SQL',
  'Accessibility', 'Performance',
];

export const SCAN_STEPS = [
  'Reading document…',
  'Extracting text…',
  'Matching skills…',
  'Scoring…',
];

/**
 * FNV-1a: tiny, stable string hash. Same input -> same number, which is
 * what makes the mock feel real (no result flickering between runs).
 */
export function hashString(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function verdictFor(score) {
  if (score >= 80) return 'Strong match';
  if (score >= 60) return 'Good start';
  if (score >= 45) return 'Needs work';
  return 'Missing key skills';
}

/**
 * MOCK: no PDF is read. The filename is hashed and that seed decides which
 * skills are "found", so the same file always scores the same.
 *
 * To go real, replace the body of this function with one that extracts the
 * PDF text (pdf.js, or your own back end) and keep the return shape:
 *   { score: Number, found: String[], missing: String[], verdict: String }
 */
export function analyseResume(fileName) {
  const seed = hashString(fileName.toLowerCase());

  const found = [];
  const missing = [];

  ROLE_SKILLS.forEach((skill, i) => {
    const bit = (seed >>> (i % 24)) & 1;
    const jitter = hashString(skill + seed) % 5;
    (bit ^ (jitter > 3 ? 1 : 0) ? found : missing).push(skill);
  });

  // Never show a lopsided or empty result — it reads as broken.
  while (found.length < 4) found.push(missing.pop());
  while (missing.length < 3) missing.push(found.pop());

  const coverage = found.length / ROLE_SKILLS.length;
  const score = Math.min(97, Math.max(28, Math.round(coverage * 82 + (seed % 15))));

  return { score, found, missing, verdict: verdictFor(score) };
}
