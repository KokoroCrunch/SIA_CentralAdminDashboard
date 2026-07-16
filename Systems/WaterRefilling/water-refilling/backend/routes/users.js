const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { getNextId } = require('../utils/getNextId');

const SALT_ROUNDS = 10;

function sanitize(user) {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  return obj;
}

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().sort({ _id: 1 }).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/users
router.post('/', async (req, res) => {
  try {
    const { name, email, password, phone, address, role } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'name, email, and password are required' });
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const _id = await getNextId(User);
    const user = await User.create({ _id, name, email, password: hashed, phone, address, role });
    res.status(201).json(sanitize(user));
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ message: 'A user with that email already exists' });
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/users/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, email, password, phone, address, role } = req.body;
    const update = { name, email, phone, address, role };
    if (password) {
      update.password = await bcrypt.hash(password, SALT_ROUNDS);
    }
    const user = await User.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ message: 'A user with that email already exists' });
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
