'use strict';

/**
 * Complaint (CampusFeedback) Routes
 *
 * Mounted at /api/v1/complaint.
 * All routes require authentication.
 *
 * NOTE: Static path segments (/stats, /users) MUST be registered before
 * wildcard segments (/:id) to prevent Express matching them as params.
 */

const { Router } = require('express');
const bcrypt = require('bcryptjs');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const AppError = require('../../utils/AppError');
const auditLog = require('../../utils/auditLog');
const {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaint,
  deleteComplaint,
  getStats,
  getAttachment,
} = require('../../controllers/complaint.controller');
const { getComplaintUserModel } = require('../../models/complaint/Feedback');

const COMPLAINT_ROLES = ['user', 'admin'];

const router = Router();

router.use(authenticate);

// ── 1. Static routes first ────────────────────────────────────────────────────

router.get('/stats', getStats);
router.get('/', getComplaints);
router.post('/', createComplaint);

// ── 2. User management routes (must come before /:id) ────────────────────────

// GET /api/v1/complaint/users
router.get('/users', authorize('admin', 'staff'), async (req, res, next) => {
  try {
    const User = await getComplaintUserModel();
    const users = await User.find().select('-password').sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/complaint/users
router.post('/users', authorize('admin'), async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password)
      return next(new AppError('name, email, and password are required', 400));
    if (password.length < 8)
      return next(new AppError('Password must be at least 8 characters', 400));
    if (role && !COMPLAINT_ROLES.includes(role))
      return next(new AppError(`role must be one of: ${COMPLAINT_ROLES.join(', ')}`, 400));

    const User = await getComplaintUserModel();
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return next(new AppError('Email already registered', 409));

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: passwordHash,
      role: role || 'user',
    });

    const obj = user.toObject();
    delete obj.password;

    auditLog(req, {
      system: 'complaint',
      action: 'created',
      entity: 'ComplaintUser',
      entityId: user._id,
      description: `Admin created complaint-system user "${name}" (${email}) with role "${role || 'user'}"`,
      meta: { name, email, role: role || 'user' },
    });

    res.status(201).json({ success: true, data: obj, message: 'User created' });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/complaint/users/:id  — update name and/or email
router.patch('/users/:id', authorize('admin'), async (req, res, next) => {
  try {
    const { name, email } = req.body;

    if (!name && !email)
      return next(new AppError('At least one of name or email is required', 400));

    const User = await getComplaintUserModel();

    // Check email uniqueness if email is being changed
    if (email) {
      const existing = await User.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: req.params.id },
      });
      if (existing) return next(new AppError('Email already in use by another user', 409));
    }

    const updates = {};
    if (name) updates.name = name.trim();
    if (email) updates.email = email.toLowerCase().trim();

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true })
      .select('-password')
      .lean();

    if (!user) return next(new AppError('User not found', 404));

    auditLog(req, {
      system: 'complaint',
      action: 'updated',
      entity: 'ComplaintUser',
      entityId: req.params.id,
      description: `Admin updated complaint-system user — ${Object.entries(updates)
        .map(([k, v]) => `${k}: "${v}"`)
        .join(', ')}`,
      meta: updates,
    });

    res.json({ success: true, data: user, message: 'User updated' });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/complaint/users/:id/role
router.patch('/users/:id/role', authorize('admin'), async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!role || !COMPLAINT_ROLES.includes(role))
      return next(new AppError(`role must be one of: ${COMPLAINT_ROLES.join(', ')}`, 400));

    const User = await getComplaintUserModel();
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true })
      .select('-password')
      .lean();

    if (!user) return next(new AppError('User not found', 404));

    auditLog(req, {
      system: 'complaint',
      action: 'updated',
      entity: 'ComplaintUser',
      entityId: req.params.id,
      description: `Admin changed complaint-system user ${req.params.id} role to "${role}"`,
      meta: { newRole: role },
    });

    res.json({ success: true, data: user, message: 'Role updated' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/complaint/users/:id
router.delete('/users/:id', authorize('admin'), async (req, res, next) => {
  try {
    const User = await getComplaintUserModel();
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return next(new AppError('User not found', 404));

    auditLog(req, {
      system: 'complaint',
      action: 'deleted',
      entity: 'ComplaintUser',
      entityId: req.params.id,
      description: `Admin deleted complaint-system user "${user.name}" (${user.email})`,
      meta: { name: user.name, email: user.email },
    });

    res.json({ success: true, data: null, message: 'User deleted' });
  } catch (err) {
    next(err);
  }
});

// ── 3. Wildcard /:id routes last ──────────────────────────────────────────────

// Attachment must come before bare /:id to avoid /:id matching complaint id
router.get('/:id/attachments/:attId', getAttachment);
router.get('/:id', getComplaintById);
router.patch('/:id', updateComplaint);
router.delete('/:id', deleteComplaint);

module.exports = router;
