const express = require('express');
const router = express.Router();
const {
  createReservation,
  getMyReservations,
  getAllReservations,
  updateReservationStatus,
  cancelReservation,
  getDashboardStats,
  getAnalytics,
} = require('../controllers/reservation.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

router.get('/stats', protect, adminOnly, getDashboardStats);
router.get('/analytics', protect, adminOnly, getAnalytics);
router.get('/my', protect, getMyReservations);
router.get('/', protect, adminOnly, getAllReservations);
router.post('/', protect, createReservation);
router.put('/:id/status', protect, adminOnly, updateReservationStatus);
router.put('/:id/cancel', protect, cancelReservation);

module.exports = router;
