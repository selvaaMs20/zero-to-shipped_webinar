import { runScan, listRecentScans } from '../service/scanService.js';

/**
 * POST /api/scan — score one resume against one job description.
 *
 * The controller's whole job is HTTP: pull the fields out of the parsed
 * multipart request, hand them to the service, and turn the result into a
 * response. The scoring itself never happens here.
 */
export async function createScan(req, res, next) {
  try {
    const result = await runScan({
      resumeFile: req.files?.resume?.[0],
      jobFile: req.files?.job?.[0],
      jobText: req.body.job ?? '',
      jobTitle: req.body.jobTitle ?? '',
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

/** GET /api/scans — the most recent runs, newest first. */
export async function getScans(_req, res, next) {
  try {
    const scans = await listRecentScans();
    res.json({ scans });
  } catch (err) {
    next(err);
  }
}
