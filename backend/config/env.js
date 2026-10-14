import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';

/**
 * Load the environment from wherever it actually lives.
 *
 * dotenv reads from the working directory by default, and `npm run dev` in
 * backend/ makes that backend/ — which would silently miss a .env sitting at
 * the repo root. So we name both paths explicitly: backend/.env wins, and the
 * repo-root .env is the fallback. dotenv never overwrites a variable that is
 * already set, so the first file to define one wins.
 */
const here = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(here, '../.env'), quiet: true });   // backend/.env
loadEnv({ path: path.resolve(here, '../../.env'), quiet: true }); // repo-root .env

/** Strips accidental quotes or trailing semicolons if pasted from scripts */
function cleanEnvString(val) {
  if (typeof val !== 'string') return val;
  return val.trim().replace(/^["']/, '').replace(/["'];?$/, '').replace(/;$/, '').trim();
}

/**
 * Every setting the server reads from the environment, in one place, so
 * nothing else in the codebase has to know about `process.env`.
 *
 * The Mongo URI is a secret: log it through `redactUri` in ../utils.js,
 * never as it arrives here.
 */
export const env = {
  port: Number(cleanEnvString(process.env.PORT) ?? 3001),

  // Defaults to a MongoDB on this machine so `npm run dev` works with no
  // setup at all. Point MONGODB_URI at Atlas for anything real.
  mongoUri: cleanEnvString(
    process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/zero-to-shipped'
  ),

  clientOrigin: cleanEnvString(process.env.CLIENT_ORIGIN ?? 'http://localhost:5173'),

  maxUploadBytes: Number(cleanEnvString(process.env.MAX_UPLOAD_BYTES) ?? 5 * 1024 * 1024),

  geminiApiKey: cleanEnvString(process.env.GEMINI_API_KEY ?? ''),
};
