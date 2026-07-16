'use strict';

/**
 * Token Service
 *
 * Handles all JWT lifecycle operations:
 *   - Signing access and refresh tokens
 *   - Verifying tokens (throws on invalid/expired)
 *   - Revoking tokens by writing to the RevokedToken collection
 *   - Checking revocation status
 *
 * Requirements: 2.4, 3.1, 4.1, 4.2
 */

const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/env');
const RevokedToken = require('../models/RevokedToken');

// ─── Sign ─────────────────────────────────────────────────────────────────────

/**
 * Signs a short-lived access token.
 *
 * Payload: `{ sub: userId, role, type: 'access' }`
 *
 * @param {string} userId  - The user's MongoDB ObjectId (as string)
 * @param {string} role    - The user's role ('admin' | 'staff' | 'student')
 * @returns {string} Signed JWT access token
 */
function signAccessToken(userId, role) {
  return jwt.sign({ sub: userId, role, type: 'access' }, config.jwtAccessSecret, {
    expiresIn: config.jwtAccessExpiry,
  });
}

/**
 * Signs a long-lived refresh token.
 *
 * Payload: `{ sub: userId, jti: uuid_v4, type: 'refresh' }`
 * The `jti` (JWT ID) uniquely identifies this token so it can be individually
 * revoked without knowing the raw token string.
 *
 * @param {string} userId - The user's MongoDB ObjectId (as string)
 * @returns {string} Signed JWT refresh token
 */
function signRefreshToken(userId) {
  return jwt.sign({ sub: userId, jti: uuidv4(), type: 'refresh' }, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiry,
  });
}

// ─── Verify ───────────────────────────────────────────────────────────────────

/**
 * Verifies an access token and returns its decoded payload.
 * Throws a `JsonWebTokenError` or `TokenExpiredError` if invalid or expired.
 *
 * @param {string} token - Raw JWT access token string
 * @returns {object} Decoded payload
 */
function verifyAccessToken(token) {
  return jwt.verify(token, config.jwtAccessSecret);
}

/**
 * Verifies a refresh token and returns its decoded payload.
 * Throws a `JsonWebTokenError` or `TokenExpiredError` if invalid or expired.
 *
 * @param {string} token - Raw JWT refresh token string
 * @returns {object} Decoded payload
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, config.jwtRefreshSecret);
}

// ─── Revoke ───────────────────────────────────────────────────────────────────

/**
 * Revokes an access token by storing the raw JWT string in the RevokedToken
 * collection. MongoDB's TTL index will automatically remove the document once
 * `expiresAt` is reached.
 *
 * Uses `upsert` so that revoking an already-revoked token is idempotent.
 *
 * @param {string} token     - Raw JWT access token string
 * @param {Date}   expiresAt - The token's natural expiry datetime
 * @returns {Promise<void>}
 */
async function revokeAccessToken(token, expiresAt) {
  await RevokedToken.updateOne(
    { token },
    { $setOnInsert: { token, tokenType: 'access', expiresAt } },
    { upsert: true },
  );
}

/**
 * Revokes a refresh token by storing its JTI (JWT ID) in the RevokedToken
 * collection. Storing only the JTI keeps the payload small and avoids
 * persisting the full token string for refresh tokens.
 *
 * Uses `upsert` so that revoking an already-revoked JTI is idempotent.
 *
 * @param {string} jti       - The `jti` claim from the refresh token payload
 * @param {Date}   expiresAt - The token's natural expiry datetime
 * @returns {Promise<void>}
 */
async function revokeRefreshToken(jti, expiresAt) {
  await RevokedToken.updateOne(
    { token: jti },
    { $setOnInsert: { token: jti, tokenType: 'refresh', expiresAt } },
    { upsert: true },
  );
}

// ─── Check Revocation ────────────────────────────────────────────────────────

/**
 * Checks whether a token (access token string or refresh token JTI) has been
 * revoked.
 *
 * Both access tokens (stored by raw string) and refresh tokens (stored by JTI)
 * are looked up via the same `token` field on the RevokedToken document.
 *
 * @param {string} tokenOrJti - Raw access token string, or refresh token JTI
 * @returns {Promise<boolean>} `true` if revoked, `false` otherwise
 */
async function isRevoked(tokenOrJti) {
  const doc = await RevokedToken.findOne({ token: tokenOrJti }).lean();
  return doc !== null;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  revokeAccessToken,
  revokeRefreshToken,
  isRevoked,
};
