'use strict';

const AppError = require('../utils/AppError');

/**
 * authorize — RBAC middleware factory.
 *
 * Returns Express middleware that permits access only when `req.user.role`
 * is one of the supplied `allowedRoles`. Relies on `authenticate` middleware
 * having run first to populate `req.user`.
 *
 * Usage:
 *   router.get('/admin-only', authenticate, authorize('admin'), handler);
 *   router.get('/shared',     authenticate, authorize('admin', 'staff'), handler);
 *
 * Requirements: 5.3, 5.4, 5.5, 5.6, 5.7
 *
 * @param  {...string} allowedRoles - One or more role strings permitted to access the route.
 * @returns {import('express').RequestHandler}
 */
function authorize(...allowedRoles) {
  return function (req, _res, next) {
    // Guard: authenticate middleware must have run first.
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('Forbidden: insufficient permissions', 403));
    }

    return next();
  };
}

module.exports = authorize;
