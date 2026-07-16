'use strict';

/**
 * HTTP entry point.
 *
 * Connects to MongoDB first, then starts the Express HTTP server.
 * Handles unhandled promise rejections and OS termination signals
 * (SIGTERM, SIGINT) for graceful shutdown.
 *
 * This file is NOT a module — it exports nothing.
 *
 * Requirement: 8.1
 */

const app = require('./app');
const { connectDB } = require('./db/connection');
const config = require('./config/env');

// ─── Bootstrap ────────────────────────────────────────────────────────────────

async function bootstrap() {
  // 1. Connect to MongoDB (with built-in retry + back-off).
  await connectDB();

  // 2. Start the HTTP server.
  const server = app.listen(config.port, () => {
    console.log(`[Server] Listening on http://localhost:${config.port}  (env: ${config.nodeEnv})`);
  });

  return server;
}

// ─── Graceful shutdown helper ─────────────────────────────────────────────────

/**
 * Close the HTTP server and exit the process.
 *
 * @param {import('http').Server} server - The running HTTP server instance.
 * @param {string} signal - The signal or reason that triggered shutdown.
 * @param {number} [exitCode=0] - Process exit code (1 for unexpected errors).
 */
function shutdown(server, signal, exitCode = 0) {
  console.log(`\n[Server] ${signal} received — shutting down gracefully…`);
  server.close(() => {
    console.log('[Server] HTTP server closed.');
    process.exit(exitCode);
  });
}

// ─── Start ────────────────────────────────────────────────────────────────────

bootstrap()
  .then((server) => {
    // Graceful shutdown on SIGTERM (e.g. Docker / Kubernetes stop)
    process.on('SIGTERM', () => shutdown(server, 'SIGTERM'));

    // Graceful shutdown on SIGINT (e.g. Ctrl-C in terminal)
    process.on('SIGINT', () => shutdown(server, 'SIGINT'));

    // Catch any unhandled promise rejection — log and exit with error code
    process.on('unhandledRejection', (reason) => {
      console.error('[Server] Unhandled promise rejection:', reason);
      shutdown(server, 'unhandledRejection', 1);
    });
  })
  .catch((err) => {
    // connectDB() exhausted all retries — cannot start the server
    console.error('[Server] Failed to start:', err.message);
    process.exit(1);
  });
