const router = require('express').Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Customer = require('../models/Customer');
const bcrypt = require('bcryptjs');

// GET dashboard summary (for current user's role)
router.get('/dashboard', auth, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const Order = require('../models/Order');
      const Customer = require('../models/Customer');
      const [totalCustomers, totalOrders, revenueRes, pendingOrders, recentOrders] =
        await Promise.all([
          Customer.countDocuments(),
          Order.countDocuments(),
          Order.aggregate([
            { $match: { status: 'Completed' } },
            { $group: { _id: null, total: { $sum: '$price' } } },
          ]),
          Order.countDocuments({ status: { $nin: ['Completed', 'Cancelled'] } }),
          Order.find().populate('customer', 'name contact').sort({ createdAt: -1 }).limit(8),
        ]);
      return res.json({
        totalCustomers,
        totalOrders,
        totalRevenue: revenueRes[0]?.total || 0,
        pendingOrders,
        recentOrders,
      });
    } else {
      const Order = require('../models/Order');
      const cust = await Customer.findOne({ user: req.user.id });
      if (!cust) return res.json({ myOrders: 0, myPending: 0, myCompleted: 0, recentOrders: [] });
      const [myOrders, myPending, myCompleted, recentOrders] = await Promise.all([
        Order.countDocuments({ customer: cust._id }),
        Order.countDocuments({ customer: cust._id, status: { $nin: ['Completed', 'Cancelled'] } }),
        Order.countDocuments({ customer: cust._id, status: 'Completed' }),
        Order.find({ customer: cust._id }).sort({ createdAt: -1 }).limit(5),
      ]);
      return res.json({ myOrders, myPending, myCompleted, recentOrders, customer: cust });
    }
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// PUT update profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { full_name, contact } = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, { full_name, contact }, { new: true });
    await Customer.findOneAndUpdate({ user: req.user.id }, { name: full_name, contact });
    res.json({ message: 'Profile updated', user });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// PUT change password
router.put('/password', auth, async (req, res) => {
  try {
    const { old_password, new_password } = req.body;
    const user = await User.findById(req.user.id);
    if (!(await user.matchPassword(old_password)))
      return res.status(400).json({ message: 'Current password is incorrect' });
    user.password = new_password;
    await user.save();
    res.json({ message: 'Password changed' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
