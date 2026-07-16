'use strict';

/**
 * Integration tests for the standard JSON envelope format.
 *
 * Every response from this API — success or error — must conform to the shape:
 *   { success: boolean, data: object|array|null, message: string }
 *
 * Scenarios covered:
 *   1. Success response           — valid login returns 200 with success: true, data object, message string
 *   2. Validation error           — login with missing fields returns 400 with success: false,
 *                                    data.errors array with field-level entries, message string
 *   3. 404 on unknown route       — GET /api/v1/nonexistent returns 404 with success: false,
 *                                    data: null, message string
 *   4. 401 on missing token       — POST /api/v1/auth/logout without Authorization returns 401
 *                                    with success: false, data: null, message string
 *   5. 500 on unhandled error     — errorHandler called directly with plain Error → 500,
 *                                    success: false, data: null, message string
 *
 * Requirements: 8.3
 */

// ─── Environment bootstrap ────────────────────────────────────────────────────
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

beforeAll(async () => {
  app = require('../../app');
  User = require('../../models/User');

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
 * Seed a user directly into the DB and return the user document.
 */
async function seedUser({
  name = 'Test Admin',
  email = 'admin@example.com',
  password = 'AdminPass123!',
  role = 'admin',
} = {}) {
  const passwordHash = await bcrypt.hash(password, 12);
  return User.create({ name, email, passwordHash, role });
}

/**
 * Assert that a response body conforms to the standard envelope format:
 *   { success: boolean, data: object|array|null, message: string }
 *
 * @param {object} body - The parsed response body from supertest
 */
function assertEnvelope(body) {
  // success must be a boolean
  expect(typeof body.success).toBe('boolean');

  // data must be an object, array, or null (not undefined)
  expect(body).toHaveProperty('data');
  const dataType = body.data === null ? 'null' : typeof body.data;
  expect(['object', 'null']).toContain(dataType);

  // message must be a non-empty string
  expect(typeof body.message).toBe('string');
  expect(body.message.length).toBeGreaterThan(0);
}

// =============================================================================
// 1. Success response — valid login
// =============================================================================

describe('Envelope: success response', () => {
  test('POST /api/v1/auth/login with valid credentials → 200 → standard envelope with success: true, data object, message string', async () => {
    await seedUser();

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@example.com', password: 'AdminPass123!' });

    expect(res.status).toBe(200);

    // Validate the envelope shape
    assertEnvelope(res.body);

    // Additional assertions specific to success
    expect(res.body.success).toBe(true);
    expect(res.body.data).not.toBeNull();
    expect(typeof res.body.data).toBe('object');
    expect(typeof res.body.message).toBe('string');
  });
});

// =============================================================================
// 2. Validation error — missing required fields
// =============================================================================

describe('Envelope: validation error', () => {
  test('POST /api/v1/auth/login with missing email and password → 400 → standard envelope with success: false, data.errors array, message string', async () => {
    // Send an empty body — both email and password are missing
    const res = await request(app).post('/api/v1/auth/login').send({});

    expect(res.status).toBe(400);

    // Validate the envelope shape
    assertEnvelope(res.body);

    // Additional assertions specific to validation errors
    expect(res.body.success).toBe(false);
    expect(res.body.data).not.toBeNull();
    expect(Array.isArray(res.body.data.errors)).toBe(true);
    expect(res.body.data.errors.length).toBeGreaterThan(0);

    // Each error entry must have field and message properties
    for (const err of res.body.data.errors) {
      expect(typeof err.field).toBe('string');
      expect(typeof err.message).toBe('string');
    }

    expect(typeof res.body.message).toBe('string');
  });
});

// =============================================================================
// 3. 404 on unknown route
// =============================================================================

describe('Envelope: 404 on unknown route', () => {
  test('GET /api/v1/nonexistent → 404 → standard envelope with success: false, data: null, message string', async () => {
    const res = await request(app).get('/api/v1/nonexistent');

    expect(res.status).toBe(404);

    // Validate the envelope shape
    assertEnvelope(res.body);

    // Additional assertions specific to 404
    expect(res.body.success).toBe(false);
    expect(res.body.data).toBeNull();
    expect(typeof res.body.message).toBe('string');
    // The 404 handler passes AppError('Route not found', 404)
    expect(res.body.message).toMatch(/route not found/i);
  });
});

// =============================================================================
// 4. 401 on missing Authorization token
// =============================================================================

describe('Envelope: 401 on missing token', () => {
  test('POST /api/v1/auth/logout without Authorization header → 401 → standard envelope with success: false, data: null, message string', async () => {
    // No Authorization header — authenticate middleware should reject
    const res = await request(app).post('/api/v1/auth/logout');

    expect(res.status).toBe(401);

    // Validate the envelope shape
    assertEnvelope(res.body);

    // Additional assertions specific to 401
    expect(res.body.success).toBe(false);
    expect(res.body.data).toBeNull();
    expect(typeof res.body.message).toBe('string');
  });
});

// =============================================================================
// 5. 500 on forced unhandled error — direct errorHandler unit test
// =============================================================================

describe('Envelope: 500 on forced unhandled error', () => {
  test('errorHandler called with a plain non-operational Error → 500 → standard envelope with success: false, data: null, message string', () => {
    // Require the error handler directly so we can call it with a mock req/res
    const errorHandler = require('../../middleware/errorHandler');

    const err = new Error('unexpected');
    // Plain Error — no isOperational flag, no known error type → should hit the catch-all 500 branch

    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    errorHandler(err, req, res, next);

    // Must respond with HTTP 500
    expect(res.status).toHaveBeenCalledWith(500);

    // The body passed to res.json must be the standard envelope
    const body = res.json.mock.calls[0][0];

    // Validate envelope shape via helper
    expect(typeof body.success).toBe('boolean');
    expect(body.data === null || typeof body.data === 'object').toBe(true);
    expect(typeof body.message).toBe('string');

    // Specific assertions for the 500 catch-all
    expect(body.success).toBe(false);
    expect(body.data).toBeNull();
    expect(body.message.length).toBeGreaterThan(0);

    // next() must NOT be called — the error handler terminates the chain
    expect(next).not.toHaveBeenCalled();
  });
});
