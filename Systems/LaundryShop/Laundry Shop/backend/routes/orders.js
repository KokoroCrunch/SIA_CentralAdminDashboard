const router = require('express').Router();
const auth = require('../middleware/auth');
const Order = require('../models/Order');
const Customer = require('../models/Customer');

const RATES = { wash_dry: 35, wash_dry_iron: 50, dry_cleaning: 80 };

// GET all orders (admin) or my orders (customer)
router.get('/', auth, async (req, res) => {
  try {
    let orders;
    if (req.user.role === 'admin') {
      const filter = {};
      if (req.query.status) filter.status = req.query.status;
      orders = await Order.find(filter)
        .populate('customer', 'name contact')
        .sort({ createdAt: -1 });
    } else {
      const cust = await Customer.findOne({ user: req.user.id });
      if (!cust) return res.json([]);
      orders = await Order.find({ customer: cust._id }).sort({ createdAt: -1 });
    }
    res.json(orders);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST create order (admin)
router.post('/', auth, async (req, res) => {
  try {
    const { customer, weight, service_type, status, notes } = req.body;
    const rate = RATES[service_type] || 35;
    const price = parseFloat(weight) * rate;
    const order = await Order.create({
      customer,
      weight,
      price,
      service_type,
      status: status || 'Pending',
      notes,
    });
    res.status(201).json(order);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// PUT update order status (admin)
router.put('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(order);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// DELETE order (admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST submit payment (customer)
router.post('/:id/pay', auth, async (req, res) => {
  try {
    const { payment_method, gcash_ref } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { payment_status: 'pending_verification', payment_method, gcash_ref: gcash_ref || '' },
      { new: true },
    );
    res.json(order);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
