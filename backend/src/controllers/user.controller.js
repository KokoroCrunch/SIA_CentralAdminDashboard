'use strict';

/**
 * User Management Controller
 *
 * Admin-only CRUD for central dashboard users.
 * Allows listing all users, creating new users, updating roles, and removing users.
 *
 * All controllers use next(err) so the global errorHandler handles responses.
 */

const bcrypt = require('bcryptjs');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const auditLog = require('../utils/auditLog');

// ─── List all users ───────────────────────────────────────────────────────────

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 }).lean();

    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

// ─── Create a new user ────────────────────────────────────────────────────────

exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return next(new AppError('name, email, password, and role are required', 400));
    }
    if (!['admin', 'staff', 'student'].includes(role)) {
      return next(new AppError('role must be admin, staff, or student', 400));
    }
    if (password.length < 8) {
      return next(new AppError('Password must be at least 8 characters', 400));
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash, role });

    auditLog(req, {
      system: 'users',
      action: 'created',
      entity: 'User',
      entityId: user._id,
      description: `Admin created user "${name}" (${email}) with role "${role}"`,
      meta: { name, email, role },
    });

    res.status(201).json({
      success: true,
      data: { id: user._id, name: user.name, email: user.email, role: user.role },
      message: 'User created',
    });
  } catch (err) {
    next(err);
  }
};

// ─── Update user role ─────────────────────────────────────────────────────────

exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!role || !['admin', 'staff', 'student'].includes(role)) {
      return next(new AppError('role must be admin, staff, or student', 400));
    }

    // Prevent an admin from demoting themselves
    if (req.params.id === req.user.id) {
      return next(new AppError('You cannot change your own role', 400));
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true },
    ).select('-passwordHash');

    if (!user) return next(new AppError('User not found', 404));

    auditLog(req, {
      system: 'users',
      action: 'updated',
      entity: 'User',
      entityId: user._id,
      description: `Admin changed role of "${user.name}" (${user.email}) to "${role}"`,
      meta: { userId: user._id, newRole: role },
    });

    res.json({
      success: true,
      data: { id: user._id, name: user.name, email: user.email, role: user.role },
      message: 'Role updated',
    });
  } catch (err) {
    next(err);
  }
};

// ─── Delete user ──────────────────────────────────────────────────────────────

exports.deleteUser = async (req, res, next) => {
  try {
    // Prevent self-deletion
    if (req.params.id === req.user.id) {
      return next(new AppError('You cannot delete your own account', 400));
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return next(new AppError('User not found', 404));

    auditLog(req, {
      system: 'users',
      action: 'deleted',
      entity: 'User',
      entityId: req.params.id,
      description: `Admin deleted user "${user.name}" (${user.email})`,
      meta: { name: user.name, email: user.email, role: user.role },
    });

    res.json({ success: true, data: null, message: 'User deleted' });
  } catch (err) {
    next(err);
  }
};
