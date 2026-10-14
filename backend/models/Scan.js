import mongoose from 'mongoose';

/**
 * One row per scan: what was uploaded, how it scored, and what came out of
 * the comparison. The PDFs themselves are never stored - only the text we
 * pulled out of them, and only the parts we scored.
 */
const scanSchema = new mongoose.Schema(
  {
    resumeName: { type: String, required: true, trim: true },
    jobTitle: { type: String, default: '', trim: true },

    score: { type: Number, required: true, min: 0, max: 100 },
    verdict: { type: String, required: true },

    // Skills present in both documents, and the JD's skills the resume
    // never mentions.
    matched: { type: [String], default: [] },
    missing: { type: [String], default: [] },

    // The raw matches, kept so a scan can be re-scored later without
    // asking the learner to upload the file again.
    resumeSkills: { type: [String], default: [] },
    jdSkills: { type: [String], default: [] },

    breakdown: {
      coverage: { type: Number, default: 0 },
      density: { type: Number, default: 0 },
      structure: { type: Number, default: 0 },
    },

    feedback: { type: String, default: '' },
    aiPowered: { type: Boolean, default: false },

    pages: { type: Number, default: 0 },
    resumeChars: { type: Number, default: 0 },
    jobChars: { type: Number, default: 0 },
    durationMs: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Newest-first listing is the only read pattern we have.
scanSchema.index({ createdAt: -1 });

export const Scan = mongoose.model('Scan', scanSchema);
