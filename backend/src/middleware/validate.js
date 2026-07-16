'use strict';

/**
 * Validation middleware factory.
 *
 * Accepts a Joi schema and returns an Express middleware that validates
 * `req.body` against it. On success, calls `next()` to proceed. On failure,
 * passes the Joi ValidationError to `next(err)` so that `errorHandler` can
 * map it to a 400 response with `data.errors = [{ field, message }]`.
 *
 * Usage:
 *   router.post('/register', validate(registerSchema), registerUser);
 *
 * Requirements: 8.5, 1.3, 1.4
 *
 * @param {import('joi').Schema} schema - A Joi object schema to validate against.
 * @returns {import('express').RequestHandler}
 */
function validate(schema) {
  return function validationMiddleware(req, _res, next) {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      // Forward the Joi ValidationError to the global errorHandler.
      // errorHandler detects `err.isJoi === true` and returns 400 with
      // `{ success: false, data: { errors: [{ field, message }] }, message }`.
      return next(error);
    }

    return next();
  };
}

module.exports = validate;
