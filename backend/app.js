import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { connectDb, isDbReady } from './config/db.js';
import { scanRouter } from './routes/scan.js';
import { notFound, errorHandler } from './middleware/error.js';

export function createApp() {
  const app = express();

  // Allow same-origin, configured origin, and Vercel preview environments
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '1mb' }));

  // Auto-connect database on incoming requests if not already connected
  app.use(async (_req, _res, next) => {
    try {
      await connectDb();
    } catch (err) {
      console.warn('[db] auto-connect failed:', err.message);
    }
    next();
  });

  // Health check routes
  app.get(['/api/health', '/health'], (_req, res) => {
    res.json({ ok: true, db: isDbReady() ? 'connected' : 'disconnected' });
  });

  // Mount routes under both /api and root to handle any rewrite configuration
  app.use('/api', scanRouter);
  app.use('/', scanRouter);

  // Order matters: 404 handler runs only if nothing matched, errorHandler runs on errors
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
