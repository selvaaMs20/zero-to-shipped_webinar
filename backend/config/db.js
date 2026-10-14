import mongoose from 'mongoose';
import { env } from './env.js';
import { redactUri } from '../utils.js';

let dbPromise = null;

export async function connectDb() {
  if (mongoose.connection.readyState === 1) return;
  if (!dbPromise) {
    dbPromise = mongoose
      .connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 })
      .then(() => {
        console.log(`[db] connected to ${redactUri(env.mongoUri)}`);
      })
      .catch((err) => {
        dbPromise = null;
        throw err;
      });
  }
  return dbPromise;
}

export function isDbReady() {
  return mongoose.connection.readyState === 1;
}
