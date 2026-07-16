'use strict';

/**
 * Unit tests for errorHandler middleware and AppError utility.
 *
 * Uses lightweight Express app stubs and mock req/res objects so no
 * real HTTP server or database connection is needed.
 *
 * Validates: Requirement 8.3
 */

const errorHandler = require('./errorHandler');
const AppError = require('../utils/AppError');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a minimal mock Express response that records the status and body
 * that errorHandler would send to the client.
 */
function buildMockRes() {
  const res = {
    _status: null,
    _body: null,
    status(code) {
      this._status = code;
      return this;
    },
    json(body) {
      this._body = body;
      return this;
    },
  };
  return res;
}

const mockReq = {};
const mockNext = jest.fn();

// Silence console.error during tests so output stays clean.
beforeAll(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
afterAll(() => console.error.mockRestore());

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('errorHandler middleware', () => {
  describe('Joi validation errors', () => {
    it('returns 400 with field-level error array for a Joi error', () => {
      const err = {
        isJoi: true,
        details: [
          {
            path: ['email'],
            context: { label: 'email' },
            message: '"email" must be a valid email',
          },
          {
            path: ['password'],
            context: { label: 'password' },
            message: '"password" length must be at least 8 characters',
          },
        ],
      };

      const res = buildMockRes();
      errorHandler(err, mockReq, res, mockNext);

      expect(res._status).toBe(400);
      expect(res._body.success).toBe(false);
      expect(res._body.data.errors).toHaveLength(2);
      expect(res._body.data.errors[0].field).toBe('email');
      expect(res._body.data.errors[1].field).toBe('password');
    });
  });

  describe('Zod validation errors', () => {
    it('returns 400 with field-level error array for a Zod error', () => {
      const err = {
        name: 'ZodError',
        errors: [
          { path: ['name'], message: 'Required' },
          { path: ['role'], message: 'Invalid enum value' },
        ],
      };

      const res = buildMockRes();
      errorHandler(err, mockReq, res, mockNext);

      expect(res._status).toBe(400);
      expect(res._body.success).toBe(false);
      expect(res._body.data.errors).toHaveLength(2);
      expect(res._body.data.errors[0].field).toBe('name');
    });
  });

  describe('JWT errors', () => {
    it('returns 401 with safe message for JsonWebTokenError', () => {
      const err = Object.assign(new Error('invalid signature'), { name: 'JsonWebTokenError' });

      const res = buildMockRes();
      errorHandler(err, mockReq, res, mockNext);

      expect(res._status).toBe(401);
      expect(res._body.success).toBe(false);
      expect(res._body.data).toBeNull();
      expect(res._body.message).toBe('Invalid or expired token');
    });

    it('returns 401 with safe message for TokenExpiredError', () => {
      const err = Object.assign(new Error('jwt expired'), { name: 'TokenExpiredError' });

      const res = buildMockRes();
      errorHandler(err, mockReq, res, mockNext);

      expect(res._status).toBe(401);
      expect(res._body.message).toBe('Invalid or expired token');
    });
  });

  describe('Revoked token errors', () => {
    it('returns 401 with revocation message for RevokedTokenError', () => {
      const err = Object.assign(new Error('token revoked'), { name: 'RevokedTokenError' });

      const res = buildMockRes();
      errorHandler(err, mockReq, res, mockNext);

      expect(res._status).toBe(401);
      expect(res._body.message).toBe('Token has been revoked');
    });

    it('returns 401 with revocation message when err.status === 401', () => {
      const err = Object.assign(new Error('unauthorised'), { status: 401 });

      const res = buildMockRes();
      errorHandler(err, mockReq, res, mockNext);

      expect(res._status).toBe(401);
      expect(res._body.message).toBe('Token has been revoked');
    });
  });

  describe('Forbidden errors', () => {
    it('returns 403 for ForbiddenError', () => {
      const err = Object.assign(new Error('forbidden'), { name: 'ForbiddenError' });

      const res = buildMockRes();
      errorHandler(err, mockReq, res, mockNext);

      expect(res._status).toBe(403);
      expect(res._body.success).toBe(false);
      expect(res._body.message).toBe('Forbidden: insufficient permissions');
    });

    it('returns 403 when err.status === 403', () => {
      const err = Object.assign(new Error('access denied'), { status: 403 });

      const res = buildMockRes();
      errorHandler(err, mockReq, res, mockNext);

      expect(res._status).toBe(403);
      expect(res._body.message).toBe('Forbidden: insufficient permissions');
    });
  });

  describe('Mongoose duplicate key error (code 11000)', () => {
    it('returns 409 with "Email already registered"', () => {
      const err = Object.assign(new Error('duplicate key'), { code: 11000 });

      const res = buildMockRes();
      errorHandler(err, mockReq, res, mockNext);

      expect(res._status).toBe(409);
      expect(res._body.success).toBe(false);
      expect(res._body.message).toBe('Email already registered');
    });
  });

  describe('Mongoose ValidationError', () => {
    it('returns 400 with structured field errors', () => {
      const err = {
        name: 'ValidationError',
        errors: {
          email: { path: 'email', message: 'Path `email` is required.' },
          role: { path: 'role', message: '`invalid` is not a valid enum value for path `role`.' },
        },
      };

      const res = buildMockRes();
      errorHandler(err, mockReq, res, mockNext);

      expect(res._status).toBe(400);
      expect(res._body.success).toBe(false);
      expect(Array.isArray(res._body.data.errors)).toBe(true);
      expect(res._body.data.errors).toHaveLength(2);
    });
  });

  describe('AppError (operational)', () => {
    it('returns the AppError statusCode and message', () => {
      const err = new AppError('Resource not found', 404);

      const res = buildMockRes();
      errorHandler(err, mockReq, res, mockNext);

      expect(res._status).toBe(404);
      expect(res._body.success).toBe(false);
      expect(res._body.data).toBeNull();
      expect(res._body.message).toBe('Resource not found');
    });
  });

  describe('Unhandled / unexpected errors', () => {
    it('returns 500 with generic message for unknown errors', () => {
      const err = new Error('something completely unexpected');

      const res = buildMockRes();
      errorHandler(err, mockReq, res, mockNext);

      expect(res._status).toBe(500);
      expect(res._body.success).toBe(false);
      expect(res._body.data).toBeNull();
      expect(res._body.message).toBe('An unexpected error occurred');
    });

    it('does NOT include the real error message or stack in the response', () => {
      const err = new Error('DB connection string: mongodb+srv://user:s3cr3t@host/db');

      const res = buildMockRes();
      errorHandler(err, mockReq, res, mockNext);

      const bodyStr = JSON.stringify(res._body);
      expect(bodyStr).not.toContain('s3cr3t');
      expect(bodyStr).not.toContain('mongodb+srv');
    });
  });

  describe('Standard response envelope', () => {
    it('every response has success, data, and message top-level fields', () => {
      const errors = [
        { isJoi: true, details: [{ path: ['x'], context: { label: 'x' }, message: 'bad' }] },
        Object.assign(new Error(), { name: 'JsonWebTokenError' }),
        Object.assign(new Error(), { name: 'RevokedTokenError' }),
        Object.assign(new Error(), { name: 'ForbiddenError' }),
        Object.assign(new Error(), { code: 11000 }),
        new AppError('not found', 404),
        new Error('unexpected'),
      ];

      for (const err of errors) {
        const res = buildMockRes();
        errorHandler(err, mockReq, res, mockNext);

        expect(typeof res._body.success).toBe('boolean');
        expect('data' in res._body).toBe(true);
        expect(typeof res._body.message).toBe('string');
        // success should always be false on error paths
        expect(res._body.success).toBe(false);
      }
    });
  });
});

// ─── AppError tests ───────────────────────────────────────────────────────────

describe('AppError', () => {
  it('extends Error', () => {
    const err = new AppError('test', 400);
    expect(err).toBeInstanceOf(Error);
  });

  it('sets statusCode and isOperational correctly', () => {
    const err = new AppError('forbidden', 403);
    expect(err.statusCode).toBe(403);
    expect(err.isOperational).toBe(true);
  });

  it('preserves the message', () => {
    const err = new AppError('custom message', 422);
    expect(err.message).toBe('custom message');
  });

  it('captures a stack trace', () => {
    const err = new AppError('stack check', 500);
    expect(err.stack).toBeDefined();
  });
});
