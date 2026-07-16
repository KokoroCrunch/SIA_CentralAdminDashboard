'use strict';

/**
 * Express application factory.
 *
 * Applies middleware in the required order, mounts the API router, and
 * registers the 404 handler and global error handler as the final two
 * middleware layers.
 *
 * Middleware order:
 *   1. helmet       — sets security-related HTTP headers
 *   2. cors         — allows cross-origin requests from the configured client origin
 *   3. express.json — parses incoming JSON request bodies
 *   4. cookieParser — parses Cookie header into req.cookies
 *   5. morgan       — HTTP request logger (dev format)
 *
 * Requirements: 8.1, 8.2, 8.6
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const config = require('./config/env');
const AppError = require('./utils/AppError');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ─── Security & Parsing Middleware ────────────────────────────────────────────

// 1. helmet — sets various security-related HTTP response headers
app.use(helmet());

// 2. cors — restrict cross-origin requests to the configured client origin;
//    credentials: true is required so the browser sends cookies with requests
app.use(
  cors({
    origin: config.clientOrigin,
    credentials: true,
  }),
);

// 3. express.json — parse application/json request bodies
app.use(express.json());

// 4. cookieParser — parse Cookie header and populate req.cookies
app.use(cookieParser());

// 5. morgan — log HTTP requests in the 'dev' format to stdout
app.use(morgan('dev'));

// ─── API Router ───────────────────────────────────────────────────────────────

// Combined router — mounts all sub-routers (auth, etc.) under /api/v1.
const apiRouter = require('./routes/index');
app.use('/api/v1', apiRouter);

// ─── 404 Handler ──────────────────────────────────────────────────────────────

// Catch any request that did not match a registered route and forward it as an
// operational AppError so the global error handler can return the standard
// { success, data, message } envelope with a 404 status.
app.use((req, res, next) => {
  next(new AppError('Route not found', 404));
});

// ─── Global Error Handler ─────────────────────────────────────────────────────

// MUST be the last middleware registered. Express identifies error-handling
// middleware by its four-parameter signature (err, req, res, next).
app.use(errorHandler);

module.exports = app;
