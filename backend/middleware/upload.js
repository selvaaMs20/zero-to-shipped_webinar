import multer from 'multer';
import { env } from '../config/env.js';
import { HttpError } from '../utils.js';

/**
 * The multipart reader for the two-document upload.
 *
 * Files are held in memory, not on disk: the PDF exists only for the length
 * of the request, and we only ever want the text out of it. A 5 MB cap and
 * a PDF-only filter keep the obvious mistakes from reaching the controller.
 */
export const uploadDocuments = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxUploadBytes, files: 2 },
  fileFilter(_req, file, cb) {
    const isPdf =
      file.mimetype === 'application/pdf' || /\.pdf$/i.test(file.originalname);
    if (!isPdf) {
      cb(new HttpError(400, 'Only PDF files are accepted.'));
      return;
    }
    cb(null, true);
  },
}).fields([
  { name: 'resume', maxCount: 1 },
  { name: 'job', maxCount: 1 },
]);
