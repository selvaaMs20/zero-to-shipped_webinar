import mongoose from 'mongoose';
import { env } from './env.js';
import { redactUri } from '../utils.js';

export async function connectDb() {
  // Fail in 5s instead of the 30s default when nothing is listening.
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
  console.log(`[db] connected to ${redactUri(env.mongoUri)}`);
}

export function isDbReady() {
  return mongoose.connection.readyState === 1;
}
