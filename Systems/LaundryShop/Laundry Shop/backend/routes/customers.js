const router = require('express').Router();
const auth = require('../middleware/auth');
const Customer = require('../models/Customer');
const Order = require('../models/Order');

// GET all customers (admin)
router.get('/', auth, async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 }).populate('user', 'username');
    const result = await Promise.all(
      customers.map(async (c) => {
        const orders = await Order.find({ customer: c._id });
        const total_spent = orders.reduce((s, o) => s + o.price, 0);
        return { ...c.toObject(), order_count: orders.length, total_spent };
      }),
    );
    res.json(result);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST create customer
router.post('/', auth, async (req, res) => {
  try {
    const c = await Customer.create(req.body);
    res.status(201).json(c);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// PUT update customer
router.put('/:id', auth, async (req, res) => {
  try {
    const c = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(c);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// DELETE customer
router.delete('/:id', auth, async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET customer by logged-in user
router.get('/me', auth, async (req, res) => {
  try {
    const c = await Customer.findOne({ user: req.user.id });
    res.json(c);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
