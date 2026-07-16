'use strict';

/**
 * Dormitory Routes
 *
 * All routes require authentication from the central dashboard.
 *
 * Endpoints (mounted at /api/v1/dormitory):
 *   GET    /stats              — statistics (admin/staff)
 *   GET    /rooms              — list rooms
 *   POST   /rooms              — create room (admin)
 *   PUT    /rooms/:id          — update room (admin)
 *   DELETE /rooms/:id          — delete room (admin)
 *   GET    /reservations       — list reservations (all for admin/staff, own for student)
 *   POST   /reservations       — create reservation (all roles)
 *   PATCH  /reservations/:id   — update reservation status (admin/staff)
 *   DELETE /reservations/:id   — cancel/delete reservation
 */

const { Router } = require('express');
const authenticate = require('../../middleware/authenticate');
const {
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  getReservations,
  createReservation,
  updateReservation,
  deleteReservation,
  getStats,
  getUsers,
  createUser,
  deleteUser,
  updateUserRole,
} = require('../../controllers/dormitory.controller');

const router = Router();

// All dormitory routes require authentication
router.use(authenticate);

// Stats
router.get('/stats', getStats);

// Room routes
router.get('/rooms', getRooms);
router.post('/rooms', createRoom);
router.put('/rooms/:id', updateRoom);
router.delete('/rooms/:id', deleteRoom);

// Reservation routes
router.get('/reservations', getReservations);
router.post('/reservations', createReservation);
router.patch('/reservations/:id', updateReservation);
router.delete('/reservations/:id', deleteReservation);

// User routes (admin/staff only)
router.get('/users', getUsers);
router.post('/users', createUser);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

module.exports = router;
