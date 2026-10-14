import { env } from '../config/env.js';
import { isDbReady } from '../config/db.js';
import { Scan } from '../models/Scan.js';
import { extractPdfText } from './extractPdfText.js';
import { analyseDocuments } from './analyse.js';
import { analyseWithGemini } from './gemini.js';
import { HttpError } from '../utils.js';

/** Below this many characters, a "PDF" is a scanned image, not text. */
const MIN_READABLE_CHARS = 120;

/**
 * Pull text out of an uploaded PDF, turning a parser crash into an answer
 * the client can act on. `pdf-parse` throws on a corrupt or unsupported
 * file with an internal message like "Invalid PDF structure" - that is the
 * file's problem, not the server's, so it must be a 422 and must not reach
 * the generic 500 handler.
 */
async function readPdf(file, which) {
  try {
    return await extractPdfText(file.buffer);
  } catch {
    throw new HttpError(
      422,
      `That ${which} PDF could not be read. It may be corrupt or password-protected — try re-exporting it.`,
    );
  }
}

/**
 * Read the two documents, score them, and try to save the run.
 *
 * This is the whole body of the scan feature, minus HTTP. It takes the
 * parts of the request it needs and either returns a plain object or
 * throws an `HttpError` naming the status the client should see.
 *
 * When GEMINI_API_KEY is available, analysis runs through Google Gemini AI.
 * If the API call fails or is unavailable, it automatically falls back
 * to the deterministic rules-based analyser.
 */
export async function runScan({ resumeFile, jobFile, jobText = '', jobTitle = '' }) {
  const startedAt = Date.now();

  if (!resumeFile) {
    throw new HttpError(400, 'Attach a resume PDF.');
  }

  const resume = await readPdf(resumeFile, 'resume');
  if (resume.text.length < MIN_READABLE_CHARS) {
    throw new HttpError(
      422,
      'No text came out of that resume. It looks like a scan or an image — export a text-based PDF and try again.',
    );
  }

  // The JD can arrive as text pasted into the form or as a second PDF.
  let job = { text: jobText.trim(), pages: 0 };
  if (jobFile) {
    job = await readPdf(jobFile, 'job description');
  } else if (!job.text) {
    throw new HttpError(400, 'Paste the job description or attach it as a PDF.');
  }
  if (job.text.length < MIN_READABLE_CHARS) {
    throw new HttpError(
      422,
      'No text came out of that job description PDF. Paste the description as text instead.',
    );
  }

  let result;
  if (env.geminiApiKey) {
    try {
      result = await analyseWithGemini({
        resumeText: resume.text,
        jobText: job.text,
      });
      console.log(`[scan] analysed using Gemini AI (${result.modelUsed})`);
    } catch (err) {
      console.warn('[scan] Gemini AI failed, falling back to rule-based engine:', err.message);
      result = {
        ...analyseDocuments({
          resumeText: resume.text,
          jobText: job.text,
        }),
        feedback: '',
        aiPowered: false,
      };
    }
  } else {
    result = {
      ...analyseDocuments({
        resumeText: resume.text,
        jobText: job.text,
      }),
      feedback: '',
      aiPowered: false,
    };
  }

  const scan = {
    resumeName: resumeFile.originalname,
    jobTitle: jobTitle.trim().slice(0, 120),
    ...result,
    pages: resume.pages,
    resumeChars: resume.text.length,
    jobChars: job.text.length,
    durationMs: Date.now() - startedAt,
  };

  const saved = await saveScan(scan);

  return {
    scanId: saved?.doc?._id?.toString() ?? null,
    savedAt: saved?.doc?.createdAt ?? null,
    warning: saved?.warning,
    ...result,
    pages: scan.pages,
    resumeChars: scan.resumeChars,
    jobChars: scan.jobChars,
    durationMs: scan.durationMs,
  };
}

/**
 * A scan that scored is worth returning even if the write fails, so a
 * database outage degrades to "not saved" instead of a 500.
 */
async function saveScan(scan) {
  if (!isDbReady()) {
    return {
      doc: null,
      warning: 'Scored, but this run could not be saved — no database connection.',
    };
  }

  try {
    return { doc: await Scan.create(scan), warning: undefined };
  } catch (err) {
    console.error('[db] could not save scan:', err.message);
    return {
      doc: null,
      warning: 'Scored, but this run could not be saved to the database.',
    };
  }
}

/** The most recent scans, newest first. */
export async function listRecentScans(limit = 20) {
  if (!isDbReady()) {
    throw new HttpError(503, 'No database connection.');
  }

  return Scan.find().sort({ createdAt: -1 }).limit(limit).select('-__v').lean();
}
