'use strict';

/**
 * AppError — structured operational error for use in controllers and middleware.
 *
 * Controllers throw `new AppError('message', statusCode)` instead of plain
 * Error objects. The global errorHandler inspects `err.isOperational` to
 * distinguish expected application errors from unexpected programming bugs,
 * allowing it to surface a safe message to the client while logging full
 * details server-side.
 *
 * Requirement: 8.3
 */

class AppError extends Error {
  /**
   * @param {string} message  - Human-readable description of the error.
   * @param {number} statusCode - HTTP status code (e.g. 400, 401, 403, 404).
   */
  constructor(message, statusCode) {
    super(message);

    this.name = 'AppError';
    this.statusCode = statusCode;

    /**
     * `isOperational` distinguishes expected domain errors (validation failures,
     * auth rejections, etc.) from unexpected programming bugs.  The global error
     * handler uses this flag to decide whether to relay the error message to the
     * client or fall back to the generic 500 response.
     */
    this.isOperational = true;

    // Capture a clean stack trace that starts at the call site, not inside this
    // constructor, so logs are easier to read.
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

module.exports = AppError;
