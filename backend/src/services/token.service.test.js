'use strict';

/**
 * Unit tests for token.service.js
 *
 * Covers:
 *  - signAccessToken / signRefreshToken — payload shape and return type
 *  - verifyAccessToken / verifyRefreshToken — valid, expired, tampered
 *  - revokeAccessToken + isRevoked — before/after revoke, idempotent revoke
 *  - revokeRefreshToken + isRevoked — before/after revoke
 *
 * mongodb-memory-server is started/stopped by Jest's globalSetup/globalTeardown.
 * MONGO_URI and JWT env vars are injected there; we re-apply them here too so
 * the env.js Joi validation passes when the module is first required inside the
 * worker process.
 *
 * Requirements: 2.4, 3.1, 4.1, 4.2
 */

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// ─── Environment bootstrap ────────────────────────────────────────────────────
// These must be set before env.js is required (it validates at load-time).
// globalSetup sets them in the master process; here we ensure the worker also
// has them before the first require() of any app module.
beforeAll(() => {
  process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1/test';
  process.env.JWT_ACCESS_SECRET =
    process.env.JWT_ACCESS_SECRET || 'test-access-secret-at-least-32-chars-long';
  process.env.JWT_REFRESH_SECRET =
    process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-at-least-32-chars-long';
  process.env.JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
  process.env.JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';
  process.env.CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  process.env.COOKIE_SECRET = process.env.COOKIE_SECRET || 'test-cookie-secret-123';
  process.env.NODE_ENV = 'test';
});

// ─── Late-require after env vars are set ─────────────────────────────────────
let tokenService;
let RevokedToken;

beforeAll(async () => {
  // Now it's safe to require modules that depend on env.js
  tokenService = require('./token.service');
  RevokedToken = require('../models/RevokedToken');

  // Connect mongoose to the in-memory server that globalSetup started
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI);
  }
});

afterAll(async () => {
  await mongoose.disconnect();
});

// Clear the RevokedToken collection between tests so they don't bleed into
// each other.
afterEach(async () => {
  await RevokedToken.deleteMany({});
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TEST_USER_ID = new mongoose.Types.ObjectId().toString();
const TEST_ROLE = 'admin';

/** Returns a Date that is `ms` milliseconds in the future */
function futureDate(ms = 60_000) {
  return new Date(Date.now() + ms);
}

// =============================================================================
// signAccessToken
// =============================================================================

describe('signAccessToken', () => {
  test('returns a string', () => {
    const token = tokenService.signAccessToken(TEST_USER_ID, TEST_ROLE);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  test('decoded payload contains sub equal to the userId passed in', () => {
    const token = tokenService.signAccessToken(TEST_USER_ID, TEST_ROLE);
    const decoded = jwt.decode(token);
    expect(decoded.sub).toBe(TEST_USER_ID);
  });

  test('decoded payload contains role equal to the role passed in', () => {
    const token = tokenService.signAccessToken(TEST_USER_ID, TEST_ROLE);
    const decoded = jwt.decode(token);
    expect(decoded.role).toBe(TEST_ROLE);
  });

  test('decoded payload has type === "access"', () => {
    const token = tokenService.signAccessToken(TEST_USER_ID, TEST_ROLE);
    const decoded = jwt.decode(token);
    expect(decoded.type).toBe('access');
  });
});

// =============================================================================
// signRefreshToken
// =============================================================================

describe('signRefreshToken', () => {
  test('returns a string', () => {
    const token = tokenService.signRefreshToken(TEST_USER_ID);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  test('decoded payload contains sub equal to the userId passed in', () => {
    const token = tokenService.signRefreshToken(TEST_USER_ID);
    const decoded = jwt.decode(token);
    expect(decoded.sub).toBe(TEST_USER_ID);
  });

  test('decoded payload contains a jti (non-empty string UUID)', () => {
    const token = tokenService.signRefreshToken(TEST_USER_ID);
    const decoded = jwt.decode(token);
    expect(typeof decoded.jti).toBe('string');
    expect(decoded.jti.length).toBeGreaterThan(0);
  });

  test('decoded payload has type === "refresh"', () => {
    const token = tokenService.signRefreshToken(TEST_USER_ID);
    const decoded = jwt.decode(token);
    expect(decoded.type).toBe('refresh');
  });

  test('two calls produce tokens with different jti values (uniqueness)', () => {
    const t1 = jwt.decode(tokenService.signRefreshToken(TEST_USER_ID));
    const t2 = jwt.decode(tokenService.signRefreshToken(TEST_USER_ID));
    expect(t1.jti).not.toBe(t2.jti);
  });
});

// =============================================================================
// verifyAccessToken
// =============================================================================

describe('verifyAccessToken', () => {
  test('returns the decoded payload for a valid token', () => {
    const token = tokenService.signAccessToken(TEST_USER_ID, TEST_ROLE);
    const payload = tokenService.verifyAccessToken(token);
    expect(payload.sub).toBe(TEST_USER_ID);
    expect(payload.role).toBe(TEST_ROLE);
    expect(payload.type).toBe('access');
  });

  test('throws TokenExpiredError for an already-expired token', () => {
    // Sign a token that expired 1 second ago
    const expiredToken = jwt.sign(
      { sub: TEST_USER_ID, role: TEST_ROLE, type: 'access' },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: -1 },
    );
    expect(() => tokenService.verifyAccessToken(expiredToken)).toThrow(jwt.TokenExpiredError);
  });

  test('throws JsonWebTokenError for a tampered token', () => {
    const token = tokenService.signAccessToken(TEST_USER_ID, TEST_ROLE);
    const tampered = token.slice(0, -4) + 'xxxx';
    expect(() => tokenService.verifyAccessToken(tampered)).toThrow(jwt.JsonWebTokenError);
  });

  test('throws JsonWebTokenError when signed with a different secret', () => {
    const wrongSecretToken = jwt.sign(
      { sub: TEST_USER_ID, type: 'access' },
      'completely-wrong-secret',
    );
    expect(() => tokenService.verifyAccessToken(wrongSecretToken)).toThrow(jwt.JsonWebTokenError);
  });
});

// =============================================================================
// verifyRefreshToken
// =============================================================================

describe('verifyRefreshToken', () => {
  test('returns the decoded payload for a valid refresh token', () => {
    const token = tokenService.signRefreshToken(TEST_USER_ID);
    const payload = tokenService.verifyRefreshToken(token);
    expect(payload.sub).toBe(TEST_USER_ID);
    expect(typeof payload.jti).toBe('string');
    expect(payload.type).toBe('refresh');
  });

  test('throws TokenExpiredError for an already-expired refresh token', () => {
    const expiredToken = jwt.sign(
      { sub: TEST_USER_ID, jti: 'some-jti', type: 'refresh' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: -1 },
    );
    expect(() => tokenService.verifyRefreshToken(expiredToken)).toThrow(jwt.TokenExpiredError);
  });

  test('throws JsonWebTokenError for a tampered refresh token', () => {
    const token = tokenService.signRefreshToken(TEST_USER_ID);
    const tampered = token.slice(0, -4) + 'yyyy';
    expect(() => tokenService.verifyRefreshToken(tampered)).toThrow(jwt.JsonWebTokenError);
  });

  test('throws JsonWebTokenError when access secret is used to verify a refresh token', () => {
    // A refresh token cannot be verified with the access secret
    const refreshToken = tokenService.signRefreshToken(TEST_USER_ID);
    expect(() => tokenService.verifyAccessToken(refreshToken)).toThrow(jwt.JsonWebTokenError);
  });
});

// =============================================================================
// revokeAccessToken + isRevoked
// =============================================================================

describe('revokeAccessToken + isRevoked', () => {
  test('isRevoked returns false before a token is revoked', async () => {
    const token = tokenService.signAccessToken(TEST_USER_ID, TEST_ROLE);
    const revoked = await tokenService.isRevoked(token);
    expect(revoked).toBe(false);
  });

  test('isRevoked returns true after revokeAccessToken is called', async () => {
    const token = tokenService.signAccessToken(TEST_USER_ID, TEST_ROLE);
    await tokenService.revokeAccessToken(token, futureDate());
    const revoked = await tokenService.isRevoked(token);
    expect(revoked).toBe(true);
  });

  test('revoking one token does not mark a different token as revoked', async () => {
    // Use different userIds so the two tokens are guaranteed to be distinct
    // strings even when signed within the same clock second.
    const userId1 = new mongoose.Types.ObjectId().toString();
    const userId2 = new mongoose.Types.ObjectId().toString();
    const token1 = tokenService.signAccessToken(userId1, TEST_ROLE);
    const token2 = tokenService.signAccessToken(userId2, TEST_ROLE);
    await tokenService.revokeAccessToken(token1, futureDate());

    expect(await tokenService.isRevoked(token1)).toBe(true);
    expect(await tokenService.isRevoked(token2)).toBe(false);
  });
});

// =============================================================================
// revokeRefreshToken + isRevoked
// =============================================================================

describe('revokeRefreshToken + isRevoked', () => {
  test('isRevoked returns false before a JTI is revoked', async () => {
    const token = tokenService.signRefreshToken(TEST_USER_ID);
    const { jti } = jwt.decode(token);
    const revoked = await tokenService.isRevoked(jti);
    expect(revoked).toBe(false);
  });

  test('isRevoked returns true after revokeRefreshToken is called with the JTI', async () => {
    const token = tokenService.signRefreshToken(TEST_USER_ID);
    const { jti } = jwt.decode(token);
    await tokenService.revokeRefreshToken(jti, futureDate());
    const revoked = await tokenService.isRevoked(jti);
    expect(revoked).toBe(true);
  });

  test('revoking one JTI does not mark another JTI as revoked', async () => {
    const t1 = tokenService.signRefreshToken(TEST_USER_ID);
    const t2 = tokenService.signRefreshToken(TEST_USER_ID);
    const jti1 = jwt.decode(t1).jti;
    const jti2 = jwt.decode(t2).jti;

    await tokenService.revokeRefreshToken(jti1, futureDate());

    expect(await tokenService.isRevoked(jti1)).toBe(true);
    expect(await tokenService.isRevoked(jti2)).toBe(false);
  });
});

// =============================================================================
// Idempotent revocation
// =============================================================================

describe('idempotent revocation', () => {
  test('calling revokeAccessToken twice with the same token does not throw', async () => {
    const token = tokenService.signAccessToken(TEST_USER_ID, TEST_ROLE);
    const expiresAt = futureDate();

    await expect(tokenService.revokeAccessToken(token, expiresAt)).resolves.not.toThrow();
    // Second call — should be a no-op upsert, not an error
    await expect(tokenService.revokeAccessToken(token, expiresAt)).resolves.not.toThrow();
  });

  test('token is still reported as revoked after idempotent double-revoke', async () => {
    const token = tokenService.signAccessToken(TEST_USER_ID, TEST_ROLE);
    const expiresAt = futureDate();

    await tokenService.revokeAccessToken(token, expiresAt);
    await tokenService.revokeAccessToken(token, expiresAt);

    expect(await tokenService.isRevoked(token)).toBe(true);
  });

  test('calling revokeRefreshToken twice with the same JTI does not throw', async () => {
    const token = tokenService.signRefreshToken(TEST_USER_ID);
    const { jti } = jwt.decode(token);
    const expiresAt = futureDate();

    await expect(tokenService.revokeRefreshToken(jti, expiresAt)).resolves.not.toThrow();
    await expect(tokenService.revokeRefreshToken(jti, expiresAt)).resolves.not.toThrow();
  });
});
