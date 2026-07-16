'use strict';

/**
 * Unit tests for backend/src/config/env.js
 *
 * Because env.js runs its validation at require()-time, each test case uses
 * jest.resetModules() + jest.isolateModules() to load a fresh copy of the
 * module with a controlled process.env.
 */

const VALID_ENV = {
  MONGO_URI: 'mongodb://localhost:27017/test',
  JWT_ACCESS_SECRET: 'access-secret-abc',
  JWT_REFRESH_SECRET: 'refresh-secret-xyz',
  CLIENT_ORIGIN: 'http://localhost:5173',
  COOKIE_SECRET: 'cookie-secret-123',
};

/** Helper that loads env.js with the given env vars merged into process.env */
function loadConfig(overrides = {}) {
  // Merge only the keys we control; preserve other process.env keys so Node
  // internal modules (path, etc.) keep working.
  const saved = { ...process.env };

  // Clear the keys we care about, then apply VALID_ENV + overrides
  Object.assign(process.env, VALID_ENV, overrides);

  let cfg;
  jest.isolateModules(() => {
    cfg = require('./env');
  });

  // Restore original env after loading
  Object.assign(process.env, saved);

  return cfg;
}

/** Helper that attempts to load env.js and expects it to throw */
function loadConfigExpectError(overrides = {}) {
  const saved = { ...process.env };

  // Start from a clean slate for the required fields, then apply overrides
  // (some overrides intentionally omit required keys)
  const testEnv = { ...VALID_ENV, ...overrides };

  // Remove keys whose value was set to undefined in overrides
  Object.keys(overrides).forEach((key) => {
    if (overrides[key] === undefined) delete testEnv[key];
  });

  // Wipe required keys from process.env first, then apply testEnv
  [
    'MONGO_URI',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'CLIENT_ORIGIN',
    'COOKIE_SECRET',
  ].forEach((k) => delete process.env[k]);
  Object.assign(process.env, testEnv);

  let thrownError = null;
  jest.isolateModules(() => {
    try {
      require('./env');
    } catch (err) {
      thrownError = err;
    }
  });

  // Restore
  Object.assign(process.env, saved);

  return thrownError;
}

// ---------------------------------------------------------------------------
// Happy-path tests
// ---------------------------------------------------------------------------

describe('env.js — happy path', () => {
  test('exports required string fields correctly', () => {
    const cfg = loadConfig();
    expect(cfg.mongoUri).toBe(VALID_ENV.MONGO_URI);
    expect(cfg.jwtAccessSecret).toBe(VALID_ENV.JWT_ACCESS_SECRET);
    expect(cfg.jwtRefreshSecret).toBe(VALID_ENV.JWT_REFRESH_SECRET);
    expect(cfg.clientOrigin).toBe(VALID_ENV.CLIENT_ORIGIN);
    expect(cfg.cookieSecret).toBe(VALID_ENV.COOKIE_SECRET);
  });

  test('port defaults to 5000 when PORT is not set', () => {
    const cfg = loadConfig({ PORT: undefined });
    expect(cfg.port).toBe(5000);
  });

  test('port is coerced to a number when PORT is set as a string', () => {
    const cfg = loadConfig({ PORT: '3000' });
    expect(cfg.port).toBe(3000);
    expect(typeof cfg.port).toBe('number');
  });

  test('jwtAccessExpiry defaults to "15m"', () => {
    const cfg = loadConfig({ JWT_ACCESS_EXPIRY: undefined });
    expect(cfg.jwtAccessExpiry).toBe('15m');
  });

  test('jwtRefreshExpiry defaults to "7d"', () => {
    const cfg = loadConfig({ JWT_REFRESH_EXPIRY: undefined });
    expect(cfg.jwtRefreshExpiry).toBe('7d');
  });

  test('nodeEnv defaults to "development"', () => {
    const cfg = loadConfig({ NODE_ENV: undefined });
    expect(cfg.nodeEnv).toBe('development');
  });

  test('accepts NODE_ENV=production', () => {
    const cfg = loadConfig({ NODE_ENV: 'production' });
    expect(cfg.nodeEnv).toBe('production');
  });

  test('accepts NODE_ENV=test', () => {
    const cfg = loadConfig({ NODE_ENV: 'test' });
    expect(cfg.nodeEnv).toBe('test');
  });

  test('config object is frozen (immutable)', () => {
    const cfg = loadConfig();
    expect(Object.isFrozen(cfg)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Validation failure tests
// ---------------------------------------------------------------------------

describe('env.js — validation failures', () => {
  test('throws when MONGO_URI is missing', () => {
    const err = loadConfigExpectError({ MONGO_URI: undefined });
    expect(err).not.toBeNull();
    expect(err.message).toMatch(/Environment validation failed/);
    expect(err.message).toMatch(/MONGO_URI/);
  });

  test('throws when JWT_ACCESS_SECRET is missing', () => {
    const err = loadConfigExpectError({ JWT_ACCESS_SECRET: undefined });
    expect(err).not.toBeNull();
    expect(err.message).toMatch(/JWT_ACCESS_SECRET/);
  });

  test('throws when JWT_REFRESH_SECRET is missing', () => {
    const err = loadConfigExpectError({ JWT_REFRESH_SECRET: undefined });
    expect(err).not.toBeNull();
    expect(err.message).toMatch(/JWT_REFRESH_SECRET/);
  });

  test('throws when CLIENT_ORIGIN is missing', () => {
    const err = loadConfigExpectError({ CLIENT_ORIGIN: undefined });
    expect(err).not.toBeNull();
    expect(err.message).toMatch(/CLIENT_ORIGIN/);
  });

  test('throws when COOKIE_SECRET is missing', () => {
    const err = loadConfigExpectError({ COOKIE_SECRET: undefined });
    expect(err).not.toBeNull();
    expect(err.message).toMatch(/COOKIE_SECRET/);
  });

  test('throws when NODE_ENV has an invalid value', () => {
    const err = loadConfigExpectError({ NODE_ENV: 'staging' });
    expect(err).not.toBeNull();
    expect(err.message).toMatch(/NODE_ENV/);
  });

  test('error message contains all missing fields when multiple are absent', () => {
    const err = loadConfigExpectError({
      MONGO_URI: undefined,
      JWT_ACCESS_SECRET: undefined,
      JWT_REFRESH_SECRET: undefined,
    });
    expect(err).not.toBeNull();
    expect(err.message).toMatch(/MONGO_URI/);
    expect(err.message).toMatch(/JWT_ACCESS_SECRET/);
    expect(err.message).toMatch(/JWT_REFRESH_SECRET/);
  });
});
