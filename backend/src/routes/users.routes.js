'use strict';

/**
 * User Management Routes (admin-only)
 *
 * Mounted at /api/v1/users
 *
 *   GET    /          — list all users
 *   POST   /          — create a new user
 *   PATCH  /:id/role  — change a user's role
 *   DELETE /:id       — remove a user
 */

const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const {
  getUsers,
  createUser,
  updateUserRole,
  deleteUser,
} = require('../controllers/user.controller');

const router = Router();

// All user-management endpoints require authentication + admin role
router.use(authenticate, authorize('admin'));

router.get('/', getUsers);
router.post('/', createUser);
router.patch('/:id/role', updateUserRole);
router.delete('/:id', deleteUser);

module.exports = router;
