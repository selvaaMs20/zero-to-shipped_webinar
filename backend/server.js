import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { redactUri } from './utils.js';

const app = createApp();

async function main() {
  try {
    await connectDb();
  } catch (err) {
    console.error(`[db] could not connect to ${redactUri(env.mongoUri)}`);
    console.error(`[db] ${err.message}`);
    console.error(
      '[db] Is MongoDB running, or is MONGODB_URI in backend/.env correct?',
    );
  }

  const server = app.listen(env.port, () => {
    console.log(`[api] listening on http://localhost:${env.port}`);
    console.log(`[api] allowing requests from ${env.clientOrigin}`);
  });

  const shutdown = () => server.close(() => process.exit(0));
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// Start listener when running locally
main();

export default app;
export { app };
