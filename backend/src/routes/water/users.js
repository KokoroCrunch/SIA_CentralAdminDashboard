'use strict';

const express = require('express');
const router = express.Router();
const getUserModel = require('../../models/water/User');
const { getNextId } = require('../../models/water/getNextId');
const auditLog = require('../../utils/auditLog');

const VALID_ROLES = ['customer', 'admin', 'staff'];

// GET /api/v1/water/users
router.get('/', async (req, res) => {
  try {
    const User = await getUserModel();
    const users = await User.find().sort({ _id: 1 });
    res.json(users);
  } catch (err) {
    console.error('[water/users GET]', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/v1/water/users/:id
router.get('/:id', async (req, res) => {
  try {
    const User = await getUserModel();
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/v1/water/users
router.post('/', async (req, res) => {
  try {
    const User = await getUserModel();
    const { name, email, phone, address, role } = req.body;
    if (!name || !email) return res.status(400).json({ message: 'name and email are required' });
    if (role && !VALID_ROLES.includes(role))
      return res.status(400).json({ message: `role must be one of: ${VALID_ROLES.join(', ')}` });

    const _id = await getNextId(User);
    const user = await User.create({
      _id,
      name,
      email,
      phone: phone || '',
      address: address || '',
      role: role || 'customer',
    });

    auditLog(req, {
      system: 'water',
      action: 'created',
      entity: 'WaterUser',
      entityId: user._id,
      description: `Water station user "${name}" (${email}) created with role "${role || 'customer'}"`,
      meta: { name, email, role: role || 'customer', phone, address },
    });

    res.status(201).json(user);
  } catch (err) {
    console.error('[water/users POST]', err);
    if (err.code === 11000)
      return res.status(409).json({ message: 'A user with that email already exists' });
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/v1/water/users/:id  — full update
router.put('/:id', async (req, res) => {
  try {
    const User = await getUserModel();
    const { name, email, phone, address, role } = req.body;

    if (role && !VALID_ROLES.includes(role))
      return res.status(400).json({ message: `role must be one of: ${VALID_ROLES.join(', ')}` });

    const update = { name, email, phone, address };
    if (role !== undefined) update.role = role;

    const user = await User.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!user) return res.status(404).json({ message: 'User not found' });

    auditLog(req, {
      system: 'water',
      action: 'updated',
      entity: 'WaterUser',
      entityId: user._id,
      description: `Water station user "${user.name}" (${user.email}) updated`,
      meta: update,
    });

    res.json(user);
  } catch (err) {
    console.error('[water/users PUT]', err);
    if (err.code === 11000)
      return res.status(409).json({ message: 'A user with that email already exists' });
    res.status(400).json({ message: err.message });
  }
});

// PATCH /api/v1/water/users/:id/role  — role-only update
router.patch('/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!role || !VALID_ROLES.includes(role))
      return res.status(400).json({ message: `role must be one of: ${VALID_ROLES.join(', ')}` });

    const User = await getUserModel();
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true },
    );
    if (!user) return res.status(404).json({ message: 'User not found' });

    auditLog(req, {
      system: 'water',
      action: 'updated',
      entity: 'WaterUser',
      entityId: user._id,
      description: `Water station user "${user.name}" role changed to "${role}"`,
      meta: { newRole: role },
    });

    res.json(user);
  } catch (err) {
    console.error('[water/users PATCH role]', err);
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/v1/water/users/:id
router.delete('/:id', async (req, res) => {
  try {
    const User = await getUserModel();
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    auditLog(req, {
      system: 'water',
      action: 'deleted',
      entity: 'WaterUser',
      entityId: req.params.id,
      description: `Water station user "${user.name}" (${user.email}) deleted`,
      meta: { name: user.name, email: user.email, role: user.role },
    });

    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('[water/users DELETE]', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
