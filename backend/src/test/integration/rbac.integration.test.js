'use strict';

/**
 * RBAC Integration Tests
 *
 * Tests Role-Based Access Control enforcement across all protected route
 * categories using Supertest against the live Express app with an in-memory
 * MongoDB instance provided by globalSetup/globalTeardown.
 *
 * The only RBAC-enforced route currently in the system is:
 *   POST /api/v1/auth/register  — requires admin role
 *
 * Test matrix:
 *   - admin        → POST /register → 201 (authorised)
 *   - staff        → POST /register → 403 (unauthorised)
 *   - student      → POST /register → 403 (unauthorised)
 *   - unauthenticated (no token) → POST /register → 401
 *
 * Additional assertions:
 *   - 403 response shape: { success: false, message: 'Forbidden: insufficient permissions' }
 *   - 403 does NOT create a new user in the DB (side-effect check)
 *
 * Requirements: 5.3, 5.4, 5.5, 5.6, 5.7
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
 * Seed a user with the given role directly into the DB and return the user
 * document along with a valid signed access token for that user.
 *
 * @param {'admin'|'staff'|'student'} role
 * @returns {{ user: object, token: string }}
 */
async function seedUserWithRole(role) {
  const passwordHash = await bcrypt.hash('TestPass123!', 12);
  const user = await User.create({
    name: `Test ${role}`,
    email: `${role}@example.com`,
    passwordHash,
    role,
  });
  const token = signAccessToken(user._id.toString(), role);
  return { user, token };
}

/**
 * A valid registration payload for a new target user.
 * Using a fixed unique email — afterEach clears the DB so there's no collision.
 */
const NEW_USER_PAYLOAD = {
  name: 'New Student',
  email: 'newstudent@example.com',
  password: 'StudentPass789!',
  role: 'student',
};

// =============================================================================
// RBAC matrix — POST /api/v1/auth/register
// =============================================================================

describe('RBAC — POST /api/v1/auth/register', () => {
  // ── Authorised ──────────────────────────────────────────────────────────────

  test('admin caller → 201 (authorised)', async () => {
    const { token } = await seedUserWithRole('admin');

    const res = await request(app)
      .post('/api/v1/auth/register')
      .set('Authorization', `Bearer ${token}`)
      .send(NEW_USER_PAYLOAD);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      name: NEW_USER_PAYLOAD.name,
      email: NEW_USER_PAYLOAD.email,
      role: NEW_USER_PAYLOAD.role,
    });
  });

  // ── Unauthorised — staff ─────────────────────────────────────────────────────

  test('staff caller → 403 (unauthorised)', async () => {
    const { token } = await seedUserWithRole('staff');

    const res = await request(app)
      .post('/api/v1/auth/register')
      .set('Authorization', `Bearer ${token}`)
      .send(NEW_USER_PAYLOAD);

    expect(res.status).toBe(403);
  });

  // ── Unauthorised — student ───────────────────────────────────────────────────

  test('student caller → 403 (unauthorised)', async () => {
    const { token } = await seedUserWithRole('student');

    const res = await request(app)
      .post('/api/v1/auth/register')
      .set('Authorization', `Bearer ${token}`)
      .send(NEW_USER_PAYLOAD);

    expect(res.status).toBe(403);
  });

  // ── Unauthenticated ──────────────────────────────────────────────────────────

  test('unauthenticated (no token) → 401', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(NEW_USER_PAYLOAD);

    expect(res.status).toBe(401);
  });
});

// =============================================================================
// 403 response envelope shape
// =============================================================================

describe('403 response envelope', () => {
  test('403 body has success: false and correct message', async () => {
    const { token } = await seedUserWithRole('staff');

    const res = await request(app)
      .post('/api/v1/auth/register')
      .set('Authorization', `Bearer ${token}`)
      .send(NEW_USER_PAYLOAD);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Forbidden: insufficient permissions');
  });

  test('student 403 body also has success: false and correct message', async () => {
    const { token } = await seedUserWithRole('student');

    const res = await request(app)
      .post('/api/v1/auth/register')
      .set('Authorization', `Bearer ${token}`)
      .send(NEW_USER_PAYLOAD);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Forbidden: insufficient permissions');
  });
});

// =============================================================================
// Side-effect check — 403 must NOT create a new user in the DB
// =============================================================================

describe('403 side-effect: no user created', () => {
  test('staff 403 does NOT persist the target user in the DB', async () => {
    const { token } = await seedUserWithRole('staff');

    const res = await request(app)
      .post('/api/v1/auth/register')
      .set('Authorization', `Bearer ${token}`)
      .send(NEW_USER_PAYLOAD);

    expect(res.status).toBe(403);

    // The new user email must not exist in the DB
    const createdUser = await User.findOne({ email: NEW_USER_PAYLOAD.email });
    expect(createdUser).toBeNull();
  });

  test('student 403 does NOT persist the target user in the DB', async () => {
    const { token } = await seedUserWithRole('student');

    const res = await request(app)
      .post('/api/v1/auth/register')
      .set('Authorization', `Bearer ${token}`)
      .send(NEW_USER_PAYLOAD);

    expect(res.status).toBe(403);

    const createdUser = await User.findOne({ email: NEW_USER_PAYLOAD.email });
    expect(createdUser).toBeNull();
  });
});

// =============================================================================
// Logout endpoint — authenticated-only (any valid token → 200; missing/invalid → 401)
// =============================================================================

describe('POST /api/v1/auth/logout — authenticated-only', () => {
  test('valid admin token → 200', async () => {
    const { token } = await seedUserWithRole('admin');

    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Logout successful');
  });

  test('valid staff token → 200', async () => {
    const { token } = await seedUserWithRole('staff');

    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Logout successful');
  });

  test('valid student token → 200', async () => {
    const { token } = await seedUserWithRole('student');

    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Logout successful');
  });

  test('no token → 401', async () => {
    const res = await request(app).post('/api/v1/auth/logout');

    expect(res.status).toBe(401);
  });

  test('invalid (malformed) token → 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', 'Bearer this.is.not.a.valid.jwt');

    expect(res.status).toBe(401);
  });
});

// =============================================================================
// Public routes — login & refresh require no auth token
// =============================================================================

describe('Public routes — no auth token required', () => {
  test('POST /api/v1/auth/login succeeds with valid credentials (no token needed)', async () => {
    await seedUserWithRole('admin');

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@example.com', password: 'TestPass123!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
  });

  test('POST /api/v1/auth/login returns 401 on wrong credentials (no token needed)', async () => {
    await seedUserWithRole('admin');

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@example.com', password: 'WrongPassword!' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  test('POST /api/v1/auth/refresh returns 401 when no refresh cookie is present', async () => {
    const res = await request(app).post('/api/v1/auth/refresh');

    // No cookie supplied → missing/invalid token → 401
    expect(res.status).toBe(401);
  });
});
