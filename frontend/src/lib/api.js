/**
 * The one place the browser talks to the API.
 *
 * Every call goes to a relative path — Vite proxies `/api` to the Express
 * server in dev (see vite.config.js), so there is no host or port baked in
 * and no CORS preflight from the browser's point of view.
 */

/** The steps the UI shows progress through while the scan is in flight. */
export const SCAN_STEPS = [
  'Reading document…',
  'Extracting text…',
  'Matching skills…',
  'Scoring…',
];

export const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Send a resume, and either pasted job-description text or a JD PDF, to
 * POST /api/scan.
 *
 * Throws an Error carrying the server's own message, so the caller can put
 * it straight in front of the user rather than inventing its own wording.
 */
export async function scanResume({ resumeFile, jobFile, jobText, jobTitle = '' }) {
  const form = new FormData();
  form.append('resume', resumeFile);
  if (jobFile) form.append('job', jobFile);
  if (jobText) form.append('job', jobText);
  if (jobTitle) form.append('jobTitle', jobTitle);

  let res;
  try {
    res = await fetch('/api/scan', { method: 'POST', body: form });
  } catch {
    throw new Error(
      'Could not reach the API. Is the backend running on port 3001?',
    );
  }

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(body?.error ?? `The scan failed (HTTP ${res.status}).`);
  }

  return body;
}
