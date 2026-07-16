const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required.' });

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Invalid email or password.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid email or password.' });

    const { password: _pw, ...safe } = user.toObject();
    res.json({ user: safe });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email, and password are required.' });

    const { getNextId } = require('../utils/getNextId');
    const hashed = await bcrypt.hash(password, 10);
    const _id = await getNextId(User);

    const user = await User.create({
      _id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashed,
      phone: phone || '',
      address: address || '',
      role: 'customer',
    });

    const { password: _pw, ...safe } = user.toObject();
    res.status(201).json({ user: safe });
  } catch (err) {
    console.error('Register error:', err);
    if (err.code === 11000)
      return res.status(409).json({ message: 'An account with that email already exists.' });
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
