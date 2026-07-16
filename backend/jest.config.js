'use strict';

/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  globalSetup: './src/test/globalSetup.js',
  globalTeardown: './src/test/globalTeardown.js',
  testMatch: ['**/*.test.js'],
  // Increase timeout for tests that spin up in-memory Mongo
  testTimeout: 30000,
};
