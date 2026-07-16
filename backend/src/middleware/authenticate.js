'use strict';

/**
 * Authenticate Middleware
 *
 * Validates the Bearer access token on every protected route:
 *   1. Extracts the token from the `Authorization: Bearer <token>` header.
 *   2. Verifies the JWT signature and expiry via `verifyAccessToken`.
 *   3. Checks the RevokedToken collection via `isRevoked`.
 *   4. Populates `req.user = { id, role }` from the verified payload.
 *
 * Any failure calls `next(err)` so the global errorHandler handles the
 * response consistently.
 *
 * Requirements: 5.2, 4.1
 */

const { verifyAccessToken, isRevoked } = require('../services/token.service');
const AppError = require('../utils/AppError');

/**
 * Express middleware that authenticates an incoming request.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function authenticate(req, res, next) {
  try {
    // ── Step 1: Extract Bearer token ────────────────────────────────────────
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('No token provided', 401));
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix

    if (!token) {
      return next(new AppError('No token provided', 401));
    }

    // ── Step 2: Verify signature and expiry ─────────────────────────────────
    // verifyAccessToken throws JsonWebTokenError / TokenExpiredError on failure;
    // the errorHandler maps those to appropriate 401 responses.
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (err) {
      return next(err);
    }

    // ── Step 3: Check revocation ────────────────────────────────────────────
    const revoked = await isRevoked(token);
    if (revoked) {
      return next(new AppError('Token has been revoked', 401));
    }

    // ── Step 4: Attach user to request ──────────────────────────────────────
    req.user = {
      id: payload.sub,
      role: payload.role,
    };

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = authenticate;
