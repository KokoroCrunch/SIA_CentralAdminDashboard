const express = require('express');
const router = express.Router();
const {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
} = require('../controllers/room.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.get('/', protect, getRooms);
router.get('/:id', protect, getRoomById);
router.post('/', protect, adminOnly, upload.single('image'), createRoom);
router.put('/:id', protect, adminOnly, upload.single('image'), updateRoom);
router.delete('/:id', protect, adminOnly, deleteRoom);

module.exports = router;
