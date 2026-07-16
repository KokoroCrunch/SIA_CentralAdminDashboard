const router = require('express').Router();
const auth = require('../middleware/auth');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const User = require('../models/User');
const Notification = require('../models/Notification');

// GET all payments (admin)
router.get('/', auth, async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate({ path: 'order', populate: { path: 'customer', select: 'name' } })
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET pending verification orders (admin)
router.get('/pending', auth, async (req, res) => {
  try {
    const orders = await Order.find({ payment_status: 'pending_verification' })
      .populate('customer', 'name contact')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST confirm payment (admin)
router.post('/confirm', auth, async (req, res) => {
  try {
    const { order_id, amount, method } = req.body;
    await Payment.create({ order: order_id, amount, method });
    const order = await Order.findByIdAndUpdate(
      order_id,
      { payment_status: 'paid', status: 'Completed' },
      { new: true },
    ).populate({ path: 'customer', populate: { path: 'user', select: '_id' } });

    const custUser = order.customer?.user;
    if (custUser) {
      await Notification.create({
        user: custUser._id,
        message:
          'Your payment for Order #' +
          order._id.toString().slice(-6) +
          ' has been confirmed! ₱' +
          parseFloat(amount).toFixed(2) +
          ' via ' +
          method +
          '. Thank you!',
        type: 'payment',
        order: order_id,
      });
    }
    // mark admin notifs for this order as read
    const admin = await User.findOne({ role: 'admin' });
    if (admin)
      await Notification.updateMany({ user: admin._id, order: order_id }, { is_read: true });

    res.json({ message: 'Payment confirmed', order });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
