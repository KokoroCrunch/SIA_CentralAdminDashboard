'use strict';

/**
 * Jest globalTeardown
 *
 * Stops the in-memory MongoDB instance that was started in globalSetup.
 */

module.exports = async function globalTeardown() {
  if (global.__MONGOD__) {
    await global.__MONGOD__.stop();
  }
};
