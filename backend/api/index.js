import { createApp } from '../app.js';
import { connectDb } from '../config/db.js';

/**
 * Vercel serverless entry point.
 *
 * server.js is the local entry: it calls `listen()` and `process.exit()`,
 * neither of which belongs in a serverless function — Vercel owns the socket
 * and the process. This file does the two things that *are* needed here:
 * connect to Mongo, then hand the request to the same Express app.
 *
 * The app is built once per cold start and reused for the life of the warm
 * instance; `dbReady` is a promise so that concurrent first requests don't
 * each open their own connection.
 */
const app = createApp();

let dbReady = null;
function ensureDb() {
  if (!dbReady) {
    dbReady = connectDb().catch((err) => {
      // Let the next request try again rather than caching the failure.
      dbReady = null;
      throw err;
    });
  }
  return dbReady;
}

export default async function handler(req, res) {
  // A cold start can take a moment to reach Atlas; give it room rather than
  // letting Vercel cut the invocation short.
  res.setHeader('Cache-Control', 'no-store');

  try {
    await ensureDb();
  } catch (err) {
    res.status(503).json({
      error: 'Could not reach the database.',
      detail: err.message,
    });
    return;
  }

  // Vercel hands us the original path, e.g. /api/scan, but the Express app
  // mounts its routes at /api. Strip the prefix so the router matches.
  req.url = req.url.replace(/^\/api/, '') || '/';

  return app(req, res);
}
