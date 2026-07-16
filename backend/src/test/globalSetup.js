'use strict';

/**
 * Jest globalSetup
 *
 * Starts an in-memory MongoDB instance before the full test suite runs.
 * Sets process.env.MONGO_URI so any code that reads it (e.g. env.js, mongoose
 * connection helpers) gets the in-memory URI automatically.
 *
 * Also sets required JWT env vars so env.js validation passes when modules
 * are loaded during tests.
 */

const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async function globalSetup() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  // Stash the server instance so globalTeardown can stop it
  global.__MONGOD__ = mongod;

  // Set env vars that tests (and env.js) need
  process.env.MONGO_URI = uri;
  process.env.JWT_ACCESS_SECRET = 'test-access-secret-at-least-32-chars-long';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-at-least-32-chars-long';
  process.env.JWT_ACCESS_EXPIRY = '15m';
  process.env.JWT_REFRESH_EXPIRY = '7d';
  process.env.CLIENT_ORIGIN = 'http://localhost:5173';
  process.env.COOKIE_SECRET = 'test-cookie-secret-123';
  process.env.NODE_ENV = 'test';
};
