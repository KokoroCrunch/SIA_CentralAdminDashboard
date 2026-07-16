'use strict';

/**
 * Auth Controller
 *
 * Handles all authentication-related HTTP operations:
 *   - registerUser  — admin-only user creation (bcrypt hash, 12 rounds)
 *   - loginUser     — credential verification, dual-token issuance, cookie set
 *   - refreshToken  — refresh token rotation (revoke old, issue new)
 *   - logoutUser    — access + refresh token revocation, cookie clear
 *
 * All controllers propagate errors via next(err) to the global errorHandler.
 *
 * Requirements: 1.1, 1.2, 1.6, 2.1, 2.5, 3.1, 3.2, 4.1, 4.2, 4.3
 */

const bcrypt = require('bcryptjs');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const auditLog = require('../utils/auditLog');
const {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  revokeAccessToken,
  revokeRefreshToken,
  isRevoked,
} = require('../services/token.service');

// ─── Cookie Options ────────────────────────────────────────────────────────────

/**
 * Builds the refresh token cookie options.
 * `secure` is only set in production to allow testing over plain HTTP locally.
 */
function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    path: '/api/v1/auth',
  };
}

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/register
 *
 * Admin-only. Middleware chain handles authentication + authorisation before
 * this controller is reached.
 *
 * Body: { name, email, password, role }
 * Response 201: { success: true, data: { id, name, email, role }, message: 'User registered' }
 *
 * Requirements: 1.1, 1.2, 1.6
 */
async function registerUser(req, res, next) {
  try {
    const { name, email, password, role } = req.body;

    // Hash password with bcrypt (12 rounds per spec)
    const passwordHash = await bcrypt.hash(password, 12);

    // Create new user document
    const user = await User.create({ name, email, passwordHash, role });

    auditLog(req, {
      system: 'auth',
      action: 'created',
      entity: 'User',
      entityId: user._id,
      description: `Admin registered new user "${name}" (${email}) with role "${role}"`,
      meta: { name, email, role },
    });

    return res.status(201).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      message: 'User registered',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/login
 *
 * Body: { email, password }
 * Response 200: { success: true, data: { accessToken, user: { id, name, email, role } }, message: 'Login successful' }
 *
 * Uses a single generic error message for both "user not found" and "wrong
 * password" cases to avoid leaking existence information (Req 2.2, 2.3).
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */
async function loginUser(req, res, next) {
  try {
    const { email, password } = req.body;

    // Include passwordHash (excluded by default via select: false)
    const user = await User.findOne({ email }).select('+passwordHash');

    // Non-revealing rejection — identical message for missing user or wrong password
    const INVALID_CREDENTIALS_MSG = 'Invalid email or password';

    if (!user) {
      return next(new AppError(INVALID_CREDENTIALS_MSG, 401));
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return next(new AppError(INVALID_CREDENTIALS_MSG, 401));
    }

    // Issue tokens
    const accessToken = signAccessToken(user._id.toString(), user.role);
    const newRefreshToken = signRefreshToken(user._id.toString());

    // Set refresh token as HTTP-only cookie scoped to auth routes
    res.cookie('refreshToken', newRefreshToken, refreshCookieOptions());

    auditLog(req, {
      system: 'auth',
      action: 'login',
      entity: 'User',
      entityId: user._id,
      description: `User "${user.name}" (${user.email}) logged in`,
      meta: { email: user.email, role: user.role },
    });

    return res.status(200).json({
      success: true,
      data: {
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      message: 'Login successful',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/refresh
 *
 * Reads the refresh token from the HTTP-only cookie, verifies it, checks
 * revocation, then rotates: revokes the old token and issues a fresh pair.
 *
 * Response 200: { success: true, data: { accessToken }, message: 'Token refreshed' }
 *
 * Requirements: 3.1, 3.2
 */
async function refreshToken(req, res, next) {
  try {
    const token = req.cookies && req.cookies.refreshToken;

    if (!token) {
      return next(new AppError('No refresh token', 401));
    }

    // Verify signature and expiry — throws on failure
    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      return next(new AppError('Invalid or expired token', 401));
    }

    // Check revocation store
    const revoked = await isRevoked(payload.jti);
    if (revoked) {
      return next(new AppError('Token has been revoked', 401));
    }

    // Revoke the old refresh token before issuing a new one (rotation)
    await revokeRefreshToken(payload.jti, new Date(payload.exp * 1000));

    // Fetch user to obtain current role (refresh token payload does not carry role)
    const user = await User.findById(payload.sub);
    if (!user) {
      return next(new AppError('User not found', 401));
    }

    // Issue new tokens
    const accessToken = signAccessToken(user._id.toString(), user.role);
    const newRefreshToken = signRefreshToken(user._id.toString());

    // Set rotated refresh token cookie
    res.cookie('refreshToken', newRefreshToken, refreshCookieOptions());

    return res.status(200).json({
      success: true,
      data: { accessToken },
      message: 'Token refreshed',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/logout
 *
 * Revokes both the access token (from Authorization header) and the refresh
 * token cookie (if present), then clears the cookie.
 *
 * The `authenticate` middleware has already verified the access token and
 * populated `req.user` before this controller runs.
 *
 * Response 200: { success: true, data: null, message: 'Logout successful' }
 *
 * Requirements: 4.1, 4.2, 4.3
 */
async function logoutUser(req, res, next) {
  try {
    // Extract raw access token from Authorization header
    const authHeader = req.headers.authorization || '';
    const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    // Revoke the access token so it cannot be reused before natural expiry
    if (accessToken) {
      try {
        const payload = verifyAccessToken(accessToken);
        await revokeAccessToken(accessToken, new Date(payload.exp * 1000));
      } catch {
        // Token may already be expired — revoking is best-effort; continue logout
      }
    }

    // Revoke the refresh token (if the cookie is present)
    const refreshTokenValue = req.cookies && req.cookies.refreshToken;
    if (refreshTokenValue) {
      try {
        const payload = verifyRefreshToken(refreshTokenValue);
        await revokeRefreshToken(payload.jti, new Date(payload.exp * 1000));
      } catch {
        // Token may already be expired or invalid — continue logout
      }
    }

    // Clear the refresh token cookie
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });

    auditLog(req, {
      system: 'auth',
      action: 'logout',
      entity: 'User',
      entityId: req.user?.id,
      description: `User logged out`,
      meta: { userId: req.user?.id, role: req.user?.role },
    });

    return res.status(200).json({
      success: true,
      data: null,
      message: 'Logout successful',
    });
  } catch (err) {
    next(err);
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
};
