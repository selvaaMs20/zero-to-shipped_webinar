import { Router } from 'express';
import { uploadDocuments } from '../middleware/upload.js';
import { createScan, getScans } from '../controller/scanController.js';

/**
 * URL -> controller. No scoring, no upload config, no error shapes: all of
 * that lives a layer down, so this file stays readable as a map of the API.
 */
export const scanRouter = Router();

scanRouter.post('/scan', uploadDocuments, createScan);
scanRouter.get('/scans', getScans);
