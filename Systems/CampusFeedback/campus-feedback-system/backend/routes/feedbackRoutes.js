const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  createComplaint,
  getComplaints,
  updateComplaint,
  deleteComplaint,
} = require('../controllers/feedbackController');

router.post('/', authMiddleware, createComplaint);
router.get('/', authMiddleware, getComplaints);
router.patch('/:id', authMiddleware, updateComplaint);
router.delete('/:id', authMiddleware, deleteComplaint);

module.exports = router;
