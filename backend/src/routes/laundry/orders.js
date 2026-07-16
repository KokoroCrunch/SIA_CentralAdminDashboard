'use strict';

const router = require('express').Router();
const { getModel: getOrderModel } = require('../../models/laundry/Order');
const { getModel: getCustomerModel } = require('../../models/laundry/Customer');
const auditLog = require('../../utils/auditLog');

const RATES = { wash_dry: 35, wash_dry_iron: 50, dry_cleaning: 80 };

// GET /api/v1/laundry/orders
router.get('/', async (req, res) => {
  try {
    const Order = await getOrderModel();
    const Customer = await getCustomerModel();

    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const orders = await Order.find(filter).sort({ createdAt: -1 }).lean();

    // Manual populate — cross-connection safe
    const customerIds = [...new Set(orders.map((o) => String(o.customer)))];
    const customers = await Customer.find({ _id: { $in: customerIds } }).lean();
    const custMap = {};
    customers.forEach((c) => {
      custMap[String(c._id)] = c;
    });

    const populated = orders.map((o) => ({
      ...o,
      customer: custMap[String(o.customer)] || { _id: o.customer, name: 'Unknown', contact: '' },
    }));

    res.json(populated);
  } catch (e) {
    console.error('[laundry/orders GET]', e);
    res.status(500).json({ message: e.message });
  }
});

// POST /api/v1/laundry/orders
router.post('/', async (req, res) => {
  try {
    const Order = await getOrderModel();
    const { customer, weight, service_type, status, notes } = req.body;
    const rate = RATES[service_type] || 35;
    const price = parseFloat(weight) * rate;
    const order = await Order.create({
      customer,
      weight,
      price,
      service_type,
      status: status || 'Pending',
      notes: notes || '',
    });
    res.status(201).json(order);
  } catch (e) {
    console.error('[laundry/orders POST]', e);
    res.status(500).json({ message: e.message });
  }
});

// PUT /api/v1/laundry/orders/:id
router.put('/:id', async (req, res) => {
  try {
    const Order = await getOrderModel();
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (e) {
    console.error('[laundry/orders PUT]', e);
    res.status(500).json({ message: e.message });
  }
});

// DELETE /api/v1/laundry/orders/:id
router.delete('/:id', async (req, res) => {
  try {
    const Order = await getOrderModel();
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (e) {
    console.error('[laundry/orders DELETE]', e);
    res.status(500).json({ message: e.message });
  }
});

// POST /api/v1/laundry/orders/:id/pay
router.post('/:id/pay', async (req, res) => {
  try {
    const Order = await getOrderModel();
    const { payment_method, gcash_ref } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { payment_status: 'pending_verification', payment_method, gcash_ref: gcash_ref || '' },
      { new: true },
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (e) {
    console.error('[laundry/orders POST pay]', e);
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
