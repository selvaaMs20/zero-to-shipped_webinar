// Import the parser directly rather than through pdf-parse's index.js.
// That index runs a debug block when it thinks it is the main module, which
// it does under ESM imports, and then crashes trying to open a test fixture
// that doesn't ship with the package.
import parsePdf from 'pdf-parse/lib/pdf-parse.js';

/** Collapse the line-break soup a PDF's text layer arrives in. */
function normalise(text) {
  return text
    .replace(/\u0000/g, '')       // stray null bytes
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Pull the text layer out of a PDF.
 *
 * This only works on PDFs that *have* a text layer. A PDF exported from a
 * scan or a photo - or one built from images - is pixels, and comes back
 * nearly empty. Callers should treat a very short result as "unreadable"
 * rather than "the resume contains no skills".
 */
export async function extractPdfText(buffer) {
  const { text, numpages } = await parsePdf(buffer);
  return { text: normalise(text), pages: numpages ?? 0 };
}
