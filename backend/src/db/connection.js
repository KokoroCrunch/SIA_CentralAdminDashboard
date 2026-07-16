'use strict';

/**
 * MongoDB connection module
 *
 * Establishes a Mongoose connection with retry logic and exponential back-off.
 * Exports a `connectDB()` function that attempts to connect up to MAX_RETRIES
 * times. Each failed attempt waits longer than the previous one (base × 2^attempt)
 * before retrying. Throws after all retries are exhausted so the caller can
 * decide how to handle the failure.
 *
 * Requirement: 8.1
 */

const mongoose = require('mongoose');
const config = require('../config/env');

/** Maximum number of connection attempts before giving up. */
const MAX_RETRIES = 5;

/**
 * Base delay in milliseconds for the first retry.
 * Each subsequent retry doubles this: 1 s → 2 s → 4 s → 8 s → 16 s.
 */
const BASE_DELAY_MS = 1000;

// ---------------------------------------------------------------------------
// Connection event handlers
// ---------------------------------------------------------------------------

mongoose.connection.on('connected', () => {
  console.log(`[DB] MongoDB connected to ${mongoose.connection.host}`);
});

mongoose.connection.on('error', (err) => {
  console.error('[DB] MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('[DB] MongoDB disconnected');
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Return the exponential back-off delay for a given attempt number.
 * attempt 1 → BASE_DELAY_MS * 2^0 = 1 000 ms
 * attempt 2 → BASE_DELAY_MS * 2^1 = 2 000 ms
 * attempt 3 → BASE_DELAY_MS * 2^2 = 4 000 ms
 * …and so on.
 *
 * @param {number} attempt - The current attempt number (1-based).
 * @returns {number} Delay in milliseconds.
 */
function backoffDelay(attempt) {
  return BASE_DELAY_MS * Math.pow(2, attempt - 1);
}

/**
 * Return a promise that resolves after `ms` milliseconds.
 *
 * @param {number} ms - Duration to wait.
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// connectDB — connect with exponential back-off retry logic
// ---------------------------------------------------------------------------

/**
 * Attempt to connect to MongoDB using the URI from the validated env config.
 *
 * On failure the function waits `BASE_DELAY_MS * 2^(attempt-1)` milliseconds
 * before retrying. Once `MAX_RETRIES` attempts have all failed the function
 * throws the last encountered error so the server entry-point can log it and
 * exit cleanly.
 *
 * @param {number} [attempt=1] - Current attempt number (used internally during recursion).
 * @returns {Promise<void>} Resolves when the connection is established.
 * @throws {Error} Throws the last connection error after all retries are exhausted.
 */
async function connectDB(attempt = 1) {
  try {
    await mongoose.connect(config.mongoUri);
    // 'connected' event handler logs the success message.
  } catch (err) {
    console.error(`[DB] Connection attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}`);

    if (attempt >= MAX_RETRIES) {
      console.error('[DB] All connection attempts exhausted.');
      throw err;
    }

    const delay = backoffDelay(attempt);
    console.log(`[DB] Retrying in ${delay / 1000}s (attempt ${attempt + 1}/${MAX_RETRIES})…`);
    await sleep(delay);
    await connectDB(attempt + 1);
  }
}

module.exports = { connectDB };
