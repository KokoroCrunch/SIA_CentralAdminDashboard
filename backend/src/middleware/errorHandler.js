'use strict';

/**
 * Global error-handling middleware for the Express application.
 *
 * This MUST be registered as the last middleware in app.js, after all routes.
 * Express identifies it as an error handler because it declares four parameters:
 * (err, req, res, next).
 *
 * Behaviour:
 *  1. Logs the full error (including stack) to stderr — never to the response body.
 *  2. Maps known error types to appropriate HTTP status codes.
 *  3. Returns every error as a standard JSON envelope: { success, data, message }.
 *  4. Ensures stack traces, file paths, and internal identifiers are NEVER sent
 *     to the client.
 *
 * Requirement: 8.3
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalises Mongoose ValidationError sub-documents into a plain object that
 * mirrors the Joi field-error shape used elsewhere in the API.
 *
 * @param {import('mongoose').Error.ValidationError} err
 * @returns {Array<{ field: string, message: string }>}
 */
function formatMongooseValidationErrors(err) {
  return Object.values(err.errors).map((e) => ({
    field: e.path,
    message: e.message,
  }));
}

// ─── Error Handler ────────────────────────────────────────────────────────────

/**
 * @param {Error} err
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next   — required by Express; unused here
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // 1. Always log the full error server-side (stack, message, everything).
  //    This is the ONLY place the stack trace is written; it never leaves the server.
  console.error('[errorHandler]', err.stack || err);

  // ── 2. Map error types to status codes and safe client messages ──────────────

  // ── Joi / Zod validation errors ─────────────────────────────────────────────
  // Joi attaches `err.isJoi === true` and `err.details` (array of field errors).
  // Zod attaches `err.name === 'ZodError'` and `err.errors` (array of issues).
  if (err.isJoi === true && Array.isArray(err.details)) {
    return res.status(400).json({
      success: false,
      data: {
        errors: err.details.map((d) => ({
          field: d.context && d.context.label ? d.context.label : d.path.join('.'),
          message: d.message,
        })),
      },
      message: 'Validation failed',
    });
  }

  if (err.name === 'ZodError' && Array.isArray(err.errors)) {
    return res.status(400).json({
      success: false,
      data: {
        errors: err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
      message: 'Validation failed',
    });
  }

  // ── JWT verification failures ────────────────────────────────────────────────
  // jsonwebtoken throws JsonWebTokenError (bad signature, malformed) and
  // TokenExpiredError (exp in the past) — both indicate an invalid/expired token.
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      data: null,
      message: 'Invalid or expired token',
    });
  }

  // ── Revoked token ─────────────────────────────────────────────────────────────
  if (err.name === 'RevokedTokenError' || err.status === 401) {
    return res.status(401).json({
      success: false,
      data: null,
      message: 'Token has been revoked',
    });
  }

  // ── Insufficient role / Forbidden ────────────────────────────────────────────
  if (err.name === 'ForbiddenError' || err.status === 403) {
    return res.status(403).json({
      success: false,
      data: null,
      message: 'Forbidden: insufficient permissions',
    });
  }

  // ── Mongoose duplicate key (e.g. duplicate email on registration) ────────────
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      data: null,
      message: 'Email already registered',
    });
  }

  // ── Mongoose schema validation error ─────────────────────────────────────────
  if (err.name === 'ValidationError' && err.errors) {
    return res.status(400).json({
      success: false,
      data: { errors: formatMongooseValidationErrors(err) },
      message: 'Validation failed',
    });
  }

  // ── Operational AppError (thrown explicitly by controllers/services) ─────────
  // AppError sets `isOperational = true` and carries a meaningful message that
  // is safe to relay to the client.
  if (err.isOperational === true && err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      data: null,
      message: err.message,
    });
  }

  // ── 3. Catch-all — unexpected/unhandled errors ───────────────────────────────
  // Return a generic message to avoid leaking implementation details.
  return res.status(500).json({
    success: false,
    data: null,
    message: 'An unexpected error occurred',
  });
};

module.exports = errorHandler;
