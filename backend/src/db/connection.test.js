'use strict';

/**
 * Unit tests for backend/src/db/connection.js
 *
 * mongoose.connect is mocked so no real MongoDB instance is required.
 * The `sleep` helper inside connection.js is also effectively bypassed by
 * making mongoose.connect resolve/reject synchronously — the awaited sleep
 * returns immediately because jest.useFakeTimers is NOT used here (Mongoose
 * internal timers interact poorly with fake timers). Instead we override
 * BASE_DELAY_MS to 0 via a module-level constant replacement so real sleeps
 * are instantaneous in tests.
 *
 * Requirement: 8.1
 */

// ---------------------------------------------------------------------------
// Mock mongoose BEFORE requiring the module under test.
// ---------------------------------------------------------------------------

jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  return {
    ...actualMongoose,
    connect: jest.fn(),
    connection: {
      ...actualMongoose.connection,
      on: jest.fn(),
      host: 'mock-host',
    },
  };
});

jest.mock('../config/env', () => ({
  mongoUri: 'mongodb://localhost:27017/test',
}));

// ---------------------------------------------------------------------------
// We patch BASE_DELAY_MS to 0 so exponential-backoff sleeps resolve instantly.
// This is done by replacing the module's internal constant before each test
// via jest.resetModules + re-requiring with a modified module factory.
// ---------------------------------------------------------------------------

/** Load a fresh connection module with a zeroed BASE_DELAY_MS. */
function loadModule() {
  jest.resetModules();

  // Re-register mocks after module reset (they are cleared by resetModules)
  jest.mock('mongoose', () => {
    const actualMongoose = jest.requireActual('mongoose');
    return {
      ...actualMongoose,
      connect: jest.fn(),
      connection: {
        ...actualMongoose.connection,
        on: jest.fn(),
        host: 'mock-host',
      },
    };
  });

  jest.mock('../config/env', () => ({
    mongoUri: 'mongodb://localhost:27017/test',
  }));

  // Require the real module. Because BASE_DELAY_MS is 1000ms we cannot easily
  // zero it without rewriting the module. Instead we use jest.spyOn on the
  // global setTimeout so the promise resolves on the next microtask tick
  // without actually waiting 1–16 seconds.
  const mod = require('./connection');
  return mod;
}

// ---------------------------------------------------------------------------
// Spy on setTimeout globally so back-off delays are skipped.
// ---------------------------------------------------------------------------

let originalSetTimeout;

beforeAll(() => {
  originalSetTimeout = global.setTimeout;
});

beforeEach(() => {
  // Replace global setTimeout with a version that fires immediately
  global.setTimeout = (fn) => originalSetTimeout(fn, 0);
  jest.clearAllMocks();
});

afterEach(() => {
  global.setTimeout = originalSetTimeout;
});

// ---------------------------------------------------------------------------
// Happy-path tests
// ---------------------------------------------------------------------------

describe('connectDB — successful connection', () => {
  test('resolves without error when mongoose.connect succeeds on the first attempt', async () => {
    const { connectDB } = loadModule();
    const mongoose = require('mongoose');
    mongoose.connect.mockResolvedValueOnce(undefined);

    await expect(connectDB()).resolves.toBeUndefined();
    expect(mongoose.connect).toHaveBeenCalledTimes(1);
  });

  test('calls mongoose.connect with the URI from config', async () => {
    const { connectDB } = loadModule();
    const mongoose = require('mongoose');
    mongoose.connect.mockResolvedValueOnce(undefined);

    await connectDB();

    expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017/test');
  });
});

// ---------------------------------------------------------------------------
// Retry logic tests
// ---------------------------------------------------------------------------

describe('connectDB — retry behaviour', () => {
  test('retries after a transient failure and resolves on the second attempt', async () => {
    const { connectDB } = loadModule();
    const mongoose = require('mongoose');
    mongoose.connect
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockResolvedValueOnce(undefined);

    await expect(connectDB()).resolves.toBeUndefined();
    expect(mongoose.connect).toHaveBeenCalledTimes(2);
  });

  test('retries across multiple failures and resolves on the final successful attempt', async () => {
    const { connectDB } = loadModule();
    const mongoose = require('mongoose');
    mongoose.connect
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockRejectedValueOnce(new Error('fail 3'))
      .mockResolvedValueOnce(undefined);

    await expect(connectDB()).resolves.toBeUndefined();
    expect(mongoose.connect).toHaveBeenCalledTimes(4);
  });

  test('throws the last error after all MAX_RETRIES (5) attempts fail', async () => {
    const { connectDB } = loadModule();
    const mongoose = require('mongoose');
    const lastError = new Error('persistent failure');
    mongoose.connect.mockRejectedValue(lastError);

    await expect(connectDB()).rejects.toThrow('persistent failure');
    expect(mongoose.connect).toHaveBeenCalledTimes(5);
  });

  test('does not call mongoose.connect more than MAX_RETRIES (5) times', async () => {
    const { connectDB } = loadModule();
    const mongoose = require('mongoose');
    mongoose.connect.mockRejectedValue(new Error('always fails'));

    await connectDB().catch(() => {});

    expect(mongoose.connect).toHaveBeenCalledTimes(5);
  });

  test('throws (not process.exit) when all retries are exhausted', async () => {
    const { connectDB } = loadModule();
    const mongoose = require('mongoose');
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    mongoose.connect.mockRejectedValue(new Error('always fails'));

    await connectDB().catch(() => {});

    expect(exitSpy).not.toHaveBeenCalled();
    exitSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// Export shape
// ---------------------------------------------------------------------------

describe('module exports', () => {
  test('exports connectDB as a named function', () => {
    const { connectDB } = loadModule();
    expect(typeof connectDB).toBe('function');
  });

  test('module does not export a default', () => {
    const mod = loadModule();
    expect(mod.default).toBeUndefined();
  });
});
