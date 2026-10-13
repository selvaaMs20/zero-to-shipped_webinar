/**
 * The skills a parser can recognise in a resume or a job description.
 *
 * `aliases` are the spellings that should all count as the same skill, so
 * "js" in a JD matches "JavaScript" on a resume. Matching is
 * case-insensitive and word-bounded, which is why the aliases can be short.
 */
export const SKILLS = [
  { name: 'JavaScript', aliases: ['javascript', 'js', 'es6', 'ecmascript'] },
  { name: 'TypeScript', aliases: ['typescript', 'ts'] },
  { name: 'React', aliases: ['react', 'react.js', 'reactjs', 'react 18'] },
  { name: 'Next.js', aliases: ['next.js', 'nextjs', 'next js'] },
  { name: 'Vue', aliases: ['vue', 'vue.js', 'vuejs'] },
  { name: 'Angular', aliases: ['angular', 'angularjs'] },
  { name: 'HTML', aliases: ['html', 'html5'] },
  { name: 'CSS', aliases: ['css', 'css3', 'scss', 'sass', 'tailwind', 'tailwindcss'] },
  { name: 'Node.js', aliases: ['node.js', 'nodejs', 'node js', 'node'] },
  { name: 'Express', aliases: ['express', 'express.js', 'expressjs'] },
  { name: 'Python', aliases: ['python', 'py'] },
  { name: 'Django', aliases: ['django'] },
  { name: 'Flask', aliases: ['flask'] },
  { name: 'Java', aliases: ['java'] },
  { name: 'Spring', aliases: ['spring', 'spring boot'] },
  { name: 'C#', aliases: ['c#', 'csharp', '.net', 'dotnet', 'asp.net'] },
  { name: 'C++', aliases: ['c++', 'cpp'] },
  { name: 'Go', aliases: ['golang', 'go lang'] },
  { name: 'Ruby', aliases: ['ruby', 'rails', 'ruby on rails'] },
  { name: 'PHP', aliases: ['php', 'laravel'] },
  { name: 'SQL', aliases: ['sql', 'mysql', 'postgres', 'postgresql', 'sqlite'] },
  { name: 'MongoDB', aliases: ['mongodb', 'mongo', 'mongoose'] },
  { name: 'Redis', aliases: ['redis'] },
  { name: 'REST APIs', aliases: ['rest', 'rest api', 'restful', 'api development', 'apis'] },
  { name: 'GraphQL', aliases: ['graphql', 'apollo'] },
  { name: 'Git', aliases: ['git', 'github', 'gitlab', 'version control'] },
  { name: 'Docker', aliases: ['docker', 'container', 'containers'] },
  { name: 'Kubernetes', aliases: ['kubernetes', 'k8s', 'eks', 'gke'] },
  { name: 'AWS', aliases: ['aws', 'amazon web services', 'ec2', 's3', 'lambda'] },
  { name: 'Azure', aliases: ['azure'] },
  { name: 'GCP', aliases: ['gcp', 'google cloud'] },
  { name: 'CI/CD', aliases: ['ci/cd', 'ci cd', 'continuous integration', 'github actions', 'jenkins'] },
  { name: 'Testing', aliases: ['testing', 'unit test', 'unit tests', 'jest', 'vitest', 'cypress', 'playwright', 'pytest', 'tdd'] },
  { name: 'Accessibility', aliases: ['accessibility', 'a11y', 'wcag', 'aria', 'screen reader'] },
  { name: 'Performance', aliases: ['performance', 'optimisation', 'optimization', 'lighthouse', 'core web vitals'] },
  { name: 'Security', aliases: ['security', 'authentication', 'authorization', 'oauth', 'jwt'] },
  { name: 'Agile', aliases: ['agile', 'scrum', 'kanban', 'jira'] },
  { name: 'Communication', aliases: ['communication', 'collaboration', 'stakeholder'] },
  { name: 'Mentoring', aliases: ['mentoring', 'mentorship', 'coaching', 'pair programming'] },
];

/**
 * Skills the parser expects a resume to have even when a job description
 * doesn't name them. Scored, but only lightly - see `BASELINE_WEIGHT` in
 * analyse.js. Keeps the output useful for a thin JD.
 */
export const BASELINE_SKILLS = ['Git', 'JavaScript', 'SQL', 'Testing', 'REST APIs'];

/**
 * Terms that look like skills but cost a resume points when they turn up in
 * a job description: they nearly always mean a seniority bar or a
 * preference, not a hard requirement.
 */
export const SENIORITY_FLAGS = [
  'senior', 'lead', 'principal', 'staff', 'architect',
  'expert', 'extensive experience', 'expertise',
];

/**
 * Build a cheap lookup of every alias to its canonical skill name.
 * Longest alias first so "node js" is tried before "node".
 */
const aliasIndex = SKILLS.flatMap(({ name, aliases }) =>
  [name.toLowerCase(), ...aliases].map((alias) => ({ alias, name })),
).sort((a, b) => b.alias.length - a.alias.length);

/** Escape a string for use inside a RegExp. */
const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const aliasPatterns = aliasIndex.map(({ alias, name }) => ({
  name,
  // \b works for words but not for "c++" or "c#", so allow either a word
  // boundary or a space/punctuation edge around the alias.
  pattern: new RegExp(`(^|[^a-z0-9+#])${escapeRegExp(alias)}([^a-z0-9+#]|$)`, 'i'),
}));

/**
 * Which skills from the catalogue appear in `text`, in catalogue order so
 * the UI doesn't reshuffle between runs.
 */
export function findSkills(text) {
  const haystack = ` ${text.toLowerCase()} `;
  const found = new Set();

  for (const { name, pattern } of aliasPatterns) {
    if (found.has(name)) continue;
    if (pattern.test(haystack)) found.add(name);
  }

  return SKILLS.map((s) => s.name).filter((name) => found.has(name));
}
