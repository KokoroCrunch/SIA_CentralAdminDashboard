const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Customer = require('../models/Customer');

const sign = (user) =>
  jwt.sign(
    {
      id: user._id,
      role: user.role,
      username: user.username,
      name: user.full_name || user.username,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' },
  );

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid username or password' });
    res.json({
      token: sign(user),
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        name: user.full_name || user.username,
      },
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { full_name, username, password, contact } = req.body;
    if (await User.findOne({ username }))
      return res.status(400).json({ message: 'Username already taken' });
    const user = await User.create({ username, password, full_name, contact, role: 'customer' });
    await Customer.create({ user: user._id, name: full_name, contact });
    res.status(201).json({ message: 'Account created! You can now log in.' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
