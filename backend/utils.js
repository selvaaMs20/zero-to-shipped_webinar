/**
 * Small helpers with no domain of their own. Anything that knows what a
 * resume or a job description *is* lives in services/ instead.
 */

/** Keep a number inside a range. */
export function clamp(n, min = 0, max = 100) {
  return Math.min(max, Math.max(min, n));
}

/**
 * A MongoDB URI usually carries a username and password. Anything we log
 * or return to the client has to have those taken out first.
 */
export function redactUri(uri) {
  return uri.replace(/\/\/[^@/]*@/, '//<credentials>@');
}

/**
 * An error with an HTTP status attached, so a service can say "this is the
 * client's fault, answer 400" without importing Express. The error
 * middleware in middleware/error.js turns it into a response.
 */
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}
