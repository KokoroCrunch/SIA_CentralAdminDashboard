'use strict';

/**
 * Integration tests for the full authentication flow.
 *
 * Uses supertest against the Express app with an in-memory MongoDB instance
 * provided by globalSetup/globalTeardown.
 *
 * Scenarios covered:
 *   1. Register — admin seeds a new user via POST /api/v1/auth/register
 *   2. Login    — valid credentials return accessToken + refreshToken cookie
 *   3. Refresh  — refresh cookie rotates to a new accessToken + new cookie
 *   4. Logout   — access token is revoked, cookie cleared
 *   5. Rejected retry — old refresh token is now revoked → 401
 *   6. Protected endpoint — revoked access token → 401
 *   7. Login with wrong password → 401 generic message
 *   8. Login with non-existent email → 401 generic message
 *
 * Requirements: 1.1, 2.1, 2.2, 2.3, 3.1, 3.2, 4.1, 4.2, 4.3
 */

// ─── Environment bootstrap ────────────────────────────────────────────────────
// Must run before any app module is required (env.js validates at load-time).
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
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const request = require('supertest');

let app;
let User;
let signAccessToken;

beforeAll(async () => {
  app = require('../../app');
  User = require('../../models/User');
  ({ signAccessToken } = require('../../services/token.service'));

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI);
  }
});

afterAll(async () => {
  await mongoose.disconnect();
});

// Clear all collections after each test to keep them isolated
afterEach(async () => {
  const { collections } = mongoose.connection;
  for (const collection of Object.values(collections)) {
    await collection.deleteMany({});
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Seed an admin user directly into the DB and return both the user document
 * and a valid access token for that user (for use as the seeded admin caller).
 */
async function seedAdmin() {
  const passwordHash = await bcrypt.hash('AdminPass123!', 12);
  const admin = await User.create({
    name: 'Seed Admin',
    email: 'admin@example.com',
    passwordHash,
    role: 'admin',
  });
  const adminToken = signAccessToken(admin._id.toString(), 'admin');
  return { admin, adminToken };
}

/**
 * Extract the Set-Cookie header value for the `refreshToken` cookie from a
 * supertest response. Returns the raw cookie string (e.g.
 * "refreshToken=<value>; Path=/...") so it can be passed back via the
 * `Cookie` header.
 */
function extractRefreshCookie(res) {
  const setCookieHeader = res.headers['set-cookie'];
  if (!setCookieHeader) return null;
  // set-cookie can be a single string or an array; find the refreshToken entry
  const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  return cookies.find((c) => c.startsWith('refreshToken=')) || null;
}

// =============================================================================
// 1. Register — admin creates a new user
// =============================================================================

describe('POST /api/v1/auth/register', () => {
  test('returns 201 with { success, data: { id, name, email, role } } when called by admin', async () => {
    const { adminToken } = await seedAdmin();

    const res = await request(app)
      .post('/api/v1/auth/register')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'New Staff',
        email: 'staff@example.com',
        password: 'StaffPass456!',
        role: 'staff',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      name: 'New Staff',
      email: 'staff@example.com',
      role: 'staff',
    });
    expect(res.body.data.id).toBeDefined();
  });

  test('returns 401 when no auth token is provided', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Ghost User',
      email: 'ghost@example.com',
      password: 'GhostPass789!',
      role: 'student',
    });

    expect(res.status).toBe(401);
  });
});

// =============================================================================
// 2. Login — valid credentials
// =============================================================================

describe('POST /api/v1/auth/login', () => {
  test('returns 200 with accessToken in body and refreshToken cookie on valid credentials', async () => {
    await seedAdmin();

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@example.com', password: 'AdminPass123!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(typeof res.body.data.accessToken).toBe('string');
    expect(res.body.data.user).toMatchObject({
      email: 'admin@example.com',
      role: 'admin',
    });

    const refreshCookie = extractRefreshCookie(res);
    expect(refreshCookie).not.toBeNull();
    expect(refreshCookie).toMatch(/^refreshToken=/);
  });

  test('returns 401 with generic message on wrong password', async () => {
    await seedAdmin();

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@example.com', password: 'WrongPassword!' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  test('returns 401 with generic message on non-existent email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: 'AnyPassword123!' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });
});

// =============================================================================
// Full auth flow: Login → Refresh → Logout → Rejected retry + Protected route
//
// The entire chain is one test so afterEach doesn't clear the DB mid-flow.
// =============================================================================

describe('Full auth flow', () => {
  test('complete Login → Refresh → Logout → rejected retry → protected route', async () => {
    // ── Seed user ──────────────────────────────────────────────────────────────
    const passwordHash = await bcrypt.hash('FlowPass123!', 12);
    await User.create({
      name: 'Flow Admin',
      email: 'flowadmin@example.com',
      passwordHash,
      role: 'admin',
    });

    // ── Step 1: Login ──────────────────────────────────────────────────────────
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'flowadmin@example.com', password: 'FlowPass123!' });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    const accessToken = loginRes.body.data.accessToken;
    const refreshCookieStr = extractRefreshCookie(loginRes);

    expect(typeof accessToken).toBe('string');
    expect(refreshCookieStr).not.toBeNull();
    expect(refreshCookieStr).toMatch(/^refreshToken=/);

    // ── Step 2: Refresh ────────────────────────────────────────────────────────
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshCookieStr);

    expect(refreshRes.status).toBe(200);
    const newAccessToken = refreshRes.body.data.accessToken;
    const newRefreshCookieStr = extractRefreshCookie(refreshRes);

    expect(typeof newAccessToken).toBe('string');
    expect(newRefreshCookieStr).not.toBeNull();
    // Token rotation: the new cookie must differ from the original
    expect(newRefreshCookieStr).not.toBe(refreshCookieStr);

    // ── Step 3: Logout ─────────────────────────────────────────────────────────
    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${newAccessToken}`)
      .set('Cookie', newRefreshCookieStr);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.message).toBe('Logout successful');

    // ── Step 4: Rejected retry — refresh token is now revoked ─────────────────
    const retryRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', newRefreshCookieStr);

    expect(retryRes.status).toBe(401);
    expect(retryRes.body.message).toBe('Token has been revoked');

    // ── Step 5: Protected endpoint — access token is now revoked ──────────────
    // Use POST /logout (requires authenticate) as a convenient protected route.
    const protectedRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${newAccessToken}`);

    expect(protectedRes.status).toBe(401);
    expect(protectedRes.body.message).toBe('Token has been revoked');
  });
});
