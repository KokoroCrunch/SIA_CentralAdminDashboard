const path = require('path');
const fs = require('fs');
const Room = require('../models/room.model');
const asyncHandler = require('../middleware/asyncHandler');

// @desc  Get all rooms
// @route GET /api/rooms
const getRooms = asyncHandler(async (req, res) => {
  const { status, type } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (type) filter.type = type;

  const rooms = await Room.find(filter).sort({ roomNumber: 1 });
  res.json(rooms);
});

// @desc  Get single room
// @route GET /api/rooms/:id
const getRoomById = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) return res.status(404).json({ message: 'Room not found' });
  res.json(room);
});

// @desc  Create room (admin)
// @route POST /api/rooms
const createRoom = asyncHandler(async (req, res) => {
  const { roomNumber, type, floor, capacity, pricePerMonth, amenities, description, status } =
    req.body;

  if (!roomNumber || !type || !floor || !capacity || !pricePerMonth) {
    return res.status(400).json({ message: 'Please fill all required fields' });
  }

  const existing = await Room.findOne({ roomNumber });
  if (existing) {
    return res.status(409).json({ message: 'Room number already exists' });
  }

  // Build image URL if a file was uploaded
  const image = req.file ? `/uploads/rooms/${req.file.filename}` : '';

  const room = await Room.create({
    roomNumber,
    type,
    floor: Number(floor),
    capacity: Number(capacity),
    pricePerMonth: Number(pricePerMonth),
    amenities: amenities ? JSON.parse(amenities) : [],
    description: description || '',
    status: status || 'available',
    image,
  });

  res.status(201).json(room);
});

// @desc  Update room (admin)
// @route PUT /api/rooms/:id
const updateRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) return res.status(404).json({ message: 'Room not found' });

  const { roomNumber, type, floor, capacity, pricePerMonth, amenities, description, status } =
    req.body;

  // If a new image was uploaded, delete the old one
  if (req.file) {
    if (room.image) {
      const oldPath = path.join(__dirname, '..', room.image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    room.image = `/uploads/rooms/${req.file.filename}`;
  }

  if (roomNumber !== undefined) room.roomNumber = roomNumber;
  if (type !== undefined) room.type = type;
  if (floor !== undefined) room.floor = Number(floor);
  if (capacity !== undefined) room.capacity = Number(capacity);
  if (pricePerMonth !== undefined) room.pricePerMonth = Number(pricePerMonth);
  if (description !== undefined) room.description = description;
  if (status !== undefined) room.status = status;
  if (amenities !== undefined) {
    room.amenities = typeof amenities === 'string' ? JSON.parse(amenities) : amenities;
  }

  await room.save();
  res.json(room);
});

// @desc  Delete room (admin)
// @route DELETE /api/rooms/:id
const deleteRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) return res.status(404).json({ message: 'Room not found' });

  // Delete image file if it exists
  if (room.image) {
    const imgPath = path.join(__dirname, '..', room.image);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }

  await room.deleteOne();
  res.json({ message: 'Room deleted' });
});

module.exports = { getRooms, getRoomById, createRoom, updateRoom, deleteRoom };
