const router = require('express').Router();
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Order = require('../models/Order');
const Customer = require('../models/Customer');

// GET notifications for current user
router.get('/', auth, async (req, res) => {
  try {
    const notifs = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(30);
    const unread = await Notification.countDocuments({ user: req.user.id, is_read: false });
    res.json({ notifications: notifs, unread });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// PUT mark one read
router.put('/:id/read', auth, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { is_read: true });
    res.json({ message: 'Read' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// PUT mark all read
router.put('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user.id }, { is_read: true });
    res.json({ message: 'All read' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Notify admin when customer submits payment
router.post('/payment-submitted', auth, async (req, res) => {
  try {
    const { order_id, method, gcash_ref } = req.body;
    const admin = await User.findOne({ role: 'admin' });
    const order = await Order.findById(order_id).populate('customer', 'name');
    if (!admin || !order) return res.status(404).json({ message: 'Not found' });
    const exists = await Notification.findOne({
      user: admin._id,
      order: order_id,
      type: 'payment',
    });
    if (!exists) {
      const msg =
        method === 'gcash'
          ? 'GCash payment submitted by ' +
            order.customer.name +
            ' for Order #' +
            order._id.toString().slice(-6) +
            ' (₱' +
            order.price.toFixed(2) +
            '). Ref: ' +
            gcash_ref
          : 'Cash payment declared by ' +
            order.customer.name +
            ' for Order #' +
            order._id.toString().slice(-6) +
            ' (₱' +
            order.price.toFixed(2) +
            '). Please confirm on pickup.';
      await Notification.create({
        user: admin._id,
        message: msg,
        type: 'payment',
        order: order_id,
      });
    }
    res.json({ message: 'Notified' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
