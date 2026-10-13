import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { isDbReady } from './config/db.js';
import { scanRouter } from './routes/scan.js';
import { notFound, errorHandler } from './middleware/error.js';

export function createApp() {
  const app = express();

  // The dev server and the API are on different ports, so the browser
  // treats every call as cross-origin. Only the configured origin is
  // allowed through.
  app.use(cors({ origin: env.clientOrigin }));
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, db: isDbReady() ? 'connected' : 'disconnected' });
  });

  app.use('/api', scanRouter);

  // Order matters: the catch-all 404 runs only if nothing above matched,
  // and the error handler only on an error - and it must be last.
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
