'use strict';

/**
 * Multi-database connection manager.
 *
 * Each sub-system reads/writes to its own Atlas database:
 *   minimart        → minimart database       (AdminHub cluster)
 *   laundrypro      → laundrypro database     (AdminHub cluster)
 *   water_refilling → water_refilling database (AdminHub cluster)
 *   complaint       → complaint database      (campus-cluster — separate Atlas cluster)
 *
 * Uses mongoose.createConnection() so each sub-system has an isolated
 * connection separate from the default connection used by the main app.
 */

const mongoose = require('mongoose');
const config = require('./env');

// ── Helper: swap the database name in a given Atlas URI ──────────────────────
function buildUriForCluster(baseUri, dbName) {
  const [path, qs] = baseUri.split('?');
  const withoutDb = path.replace(/\/[^/]*$/, '');
  return `${withoutDb}/${dbName}${qs ? '?' + qs : ''}`;
}

// Convenience wrapper using the default AdminHub cluster URI
function buildUri(dbName) {
  return buildUriForCluster(config.mongoUri, dbName);
}

// Lazy connection cache — one connection (or pending promise) per database name
const connections = {};
const pending = {};

async function getConnection(dbName) {
  // Return existing ready connection immediately
  if (connections[dbName] && connections[dbName].readyState === 1) {
    return connections[dbName];
  }

  // If a connection attempt is already in-flight, wait for it
  if (pending[dbName]) {
    return pending[dbName];
  }

  // Route each sub-system database to its configured URI
  let uri;
  if (dbName === 'complaint') {
    uri = buildUriForCluster(config.complaintMongoUri, dbName);
  } else if (dbName === 'dormitory') {
    uri = buildUriForCluster(config.dormitoryMongoUri, dbName);
  } else if (dbName === 'laundrypro') {
    uri = buildUriForCluster(config.laundryMongoUri, dbName);
  } else if (dbName === 'water_refilling') {
    uri = buildUriForCluster(config.waterMongoUri, dbName);
  } else {
    uri = buildUri(dbName);
  }

  // Store the promise so concurrent callers share one connection attempt
  pending[dbName] = mongoose
    .createConnection(uri)
    .asPromise()
    .then((conn) => {
      connections[dbName] = conn;
      delete pending[dbName];
      console.log(`[DB] Connected to database: ${dbName}`);
      return conn;
    });

  return pending[dbName];
}

module.exports = { getConnection, buildUri, buildUriForCluster };
