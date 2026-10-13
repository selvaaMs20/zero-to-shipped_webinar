import multer from 'multer';
import { env } from '../config/env.js';
import { HttpError } from '../utils.js';

/** Nothing under /api matched. */
export function notFound(_req, res) {
  res.status(404).json({ error: 'Not found.' });
}

/**
 * The single place an error becomes a response. Four arguments is what
 * marks a handler as Express's error middleware.
 */
export function errorHandler(err, _req, res, _next) {
  if (err instanceof multer.MulterError) {
    const tooBig = err.code === 'LIMIT_FILE_SIZE';
    res.status(tooBig ? 413 : 400).json({
      error: tooBig
        ? `That file is over ${Math.round(env.maxUploadBytes / 1024 / 1024)} MB.`
        : `Upload rejected: ${err.message}`,
    });
    return;
  }

  // A service can throw this to name its own status without knowing Express.
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  console.error('[error]', err);
  res.status(500).json({ error: err.message || 'Something went wrong.' });
}
