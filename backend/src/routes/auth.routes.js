'use strict';

/**
 * Auth Routes
 *
 * Wires the authentication middleware chains to their respective controllers.
 *
 * Route table:
 *   POST /register  — validate(registerSchema), authenticate, authorize('admin'), registerUser
 *   POST /login     — validate(loginSchema), loginUser
 *   POST /refresh   — refreshToken
 *   POST /logout    — authenticate, logoutUser
 *
 * Requirements: 1.1, 2.1, 3.1, 4.1
 */

const { Router } = require('express');

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../validators/auth.validators');
const {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
} = require('../controllers/auth.controller');

const router = Router();

/**
 * POST /register
 *
 * Admin-only endpoint. Validates the request body, then authenticates and
 * authorises the caller (must be an admin) before creating the new user.
 */
router.post('/register', validate(registerSchema), authenticate, authorize('admin'), registerUser);

/**
 * POST /login
 *
 * Public endpoint. Validates credentials format, then delegates to the
 * loginUser controller for credential verification and token issuance.
 */
router.post('/login', validate(loginSchema), loginUser);

/**
 * POST /refresh
 *
 * Public endpoint (token in HTTP-only cookie). Rotates the refresh token
 * and returns a fresh access token.
 */
router.post('/refresh', refreshToken);

/**
 * POST /logout
 *
 * Protected endpoint. Authenticates the caller (to obtain the access token
 * for revocation), then revokes both tokens and clears the cookie.
 */
router.post('/logout', authenticate, logoutUser);

module.exports = router;
