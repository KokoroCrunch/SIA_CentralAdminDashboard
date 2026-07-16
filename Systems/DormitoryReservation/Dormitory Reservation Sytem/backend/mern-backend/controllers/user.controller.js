const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const asyncHandler = require('../middleware/asyncHandler');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// @desc  Register new user
// @route POST /api/auth/register
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, studentId, phone } = req.body;

  if (!name || !email || !password || !studentId) {
    return res.status(400).json({ message: 'Please fill all required fields' });
  }

  const existingUser = await User.findOne({ $or: [{ email }, { studentId }] });
  if (existingUser) {
    return res.status(409).json({ message: 'Email or Student ID already registered' });
  }

  const user = await User.create({ name, email, password, studentId, phone });

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    studentId: user.studentId,
    role: user.role,
    token: generateToken(user._id),
  });
});

// @desc  Login user
// @route POST /api/auth/login
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    studentId: user.studentId,
    phone: user.phone,
    role: user.role,
    token: generateToken(user._id),
  });
});

// @desc  Get current user profile
// @route GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json(req.user);
});

// @desc  Get all users (admin)
// @route GET /api/users
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json(users);
});

// @desc  Delete a user (admin)
// @route DELETE /api/users/:id
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ message: 'User removed' });
});

module.exports = { registerUser, loginUser, getMe, getAllUsers, deleteUser };
