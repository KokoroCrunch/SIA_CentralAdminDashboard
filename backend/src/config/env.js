'use strict';

/**
 * Environment configuration
 *
 * Loads .env via dotenv, validates all required variables with Joi,
 * and exports a typed config object. The server fails fast on startup
 * if any required variable is missing or invalid.
 *
 * Requirement: 8.1
 */

// Load .env from the monorepo root (one level above backend/)
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const Joi = require('joi');

const envSchema = Joi.object({
  PORT: Joi.number().integer().positive().default(5000),

  MONGO_URI: Joi.string().required(),

  // Optional: separate Atlas cluster for the CampusFeedback/Complaint database.
  // Falls back to MONGO_URI (same cluster) if not set.
  COMPLAINT_MONGO_URI: Joi.string().allow('').optional(),

  // Optional: separate connection for the Dormitory Reservation database.
  // Falls back to MONGO_URI (same cluster, dormitory database) if not set.
  DORMITORY_MONGO_URI: Joi.string().allow('').optional(),

  // Optional: separate connection for the Laundry (laundrypro) database.
  // Falls back to MONGO_URI (same cluster, laundrypro database) if not set.
  LAUNDRY_MONGO_URI: Joi.string().allow('').optional(),

  // Optional: separate connection for the Water Refilling Station database.
  // Falls back to MONGO_URI (same cluster, water_refilling database) if not set.
  WATER_MONGO_URI: Joi.string().allow('').optional(),

  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),

  JWT_ACCESS_EXPIRY: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRY: Joi.string().default('7d'),

  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),

  CLIENT_ORIGIN: Joi.string().required(),

  COOKIE_SECRET: Joi.string().required(),
})
  .unknown(true) // allow other env vars (e.g., PATH, USERPROFILE) to pass through
  .options({ abortEarly: false }); // report all validation errors at once

// Build a copy of process.env with any literal string "undefined" values
// stripped out so that Joi can apply defaults properly. This happens when
// test helpers write `Object.assign(process.env, { PORT: undefined })` —
// process.env coerces undefined to the string "undefined".
const rawEnv = Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== 'undefined'));

const { error, value: env } = envSchema.validate(rawEnv);

if (error) {
  throw new Error(`Environment validation failed:\n${error.message}`);
}

/** @type {Readonly<import('./env').Config>} */
const config = Object.freeze({
  port: env.PORT,
  mongoUri: env.MONGO_URI,
  complaintMongoUri: env.COMPLAINT_MONGO_URI || env.MONGO_URI,
  dormitoryMongoUri: env.DORMITORY_MONGO_URI || env.MONGO_URI,
  laundryMongoUri: env.LAUNDRY_MONGO_URI || env.MONGO_URI,
  waterMongoUri: env.WATER_MONGO_URI || env.MONGO_URI,
  jwtAccessSecret: env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: env.JWT_REFRESH_SECRET,
  jwtAccessExpiry: env.JWT_ACCESS_EXPIRY,
  jwtRefreshExpiry: env.JWT_REFRESH_EXPIRY,
  nodeEnv: env.NODE_ENV,
  clientOrigin: env.CLIENT_ORIGIN,
  cookieSecret: env.COOKIE_SECRET,
});

module.exports = config;
