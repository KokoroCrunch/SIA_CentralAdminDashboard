'use strict';

const router = require('express').Router();
const { getModel: getNotifModel } = require('../../models/laundry/Notification');

// GET /api/v1/laundry/notifications — returns empty list (no per-user auth in central dashboard)
router.get('/', async (req, res) => {
  res.json({ notifications: [], unread: 0 });
});

// PUT /api/v1/laundry/notifications/read-all
// IMPORTANT: Must be defined BEFORE /:id/read to prevent Express matching
// "read-all" as the :id parameter.
router.put('/read-all', async (req, res) => {
  res.json({ message: 'All read' });
});

// PUT /api/v1/laundry/notifications/:id/read
router.put('/:id/read', async (req, res) => {
  try {
    const Notification = await getNotifModel();
    await Notification.findByIdAndUpdate(req.params.id, { is_read: true });
    res.json({ message: 'Read' });
  } catch (e) {
    console.error('[laundry/notifications PUT read]', e);
    res.status(500).json({ message: e.message });
  }
});

// POST /api/v1/laundry/notifications/payment-submitted
router.post('/payment-submitted', async (req, res) => {
  res.json({ message: 'Notified' });
});

module.exports = router;
